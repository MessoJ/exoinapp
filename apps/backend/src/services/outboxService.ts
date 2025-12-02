import { prisma } from '../index';
import { emailService } from './emailService';

// Default delay for undo send (in seconds)
const DEFAULT_UNDO_DELAY = 10;

interface QueueEmailParams {
  userId: string;
  fromName?: string;
  fromAddress: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  undoDelaySeconds?: number;
  scheduledAt?: Date; // For scheduled sending (future date)
}

interface OutboxEmail {
  id: string;
  fromName: string | null;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  sendAt: Date;
  status: string;
  userId: string;
  createdAt: Date;
}

class OutboxService {
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start processing outbox every second
    this.startProcessing();
    console.log('📤 Outbox service initialized');
  }

  // Queue an email for sending (with undo delay)
  async queueEmail(params: QueueEmailParams): Promise<{ id: string; sendAt: Date; canUndo: boolean }> {
    const {
      userId,
      fromName,
      fromAddress,
      to,
      cc = [],
      bcc = [],
      subject,
      html,
      text,
      undoDelaySeconds = DEFAULT_UNDO_DELAY,
      scheduledAt,
    } = params;

    // Calculate send time
    const sendAt = scheduledAt || new Date(Date.now() + undoDelaySeconds * 1000);
    const isScheduled = scheduledAt && scheduledAt > new Date(Date.now() + 60000); // More than 1 min in future

    const outboxEmail = await prisma.emailOutbox.create({
      data: {
        fromName,
        fromAddress,
        toAddresses: to,
        ccAddresses: cc,
        bccAddresses: bcc,
        subject,
        htmlBody: html,
        textBody: text,
        sendAt,
        status: 'PENDING',
        userId,
      },
    });

    console.log(`📧 Email queued: ${outboxEmail.id}, will send at ${sendAt.toISOString()}`);

    return {
      id: outboxEmail.id,
      sendAt,
      canUndo: !isScheduled, // Can only undo if not scheduled for later
    };
  }

  // Cancel a queued email (undo send)
  async cancelEmail(outboxId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const email = await prisma.emailOutbox.findFirst({
      where: { id: outboxId, userId },
    });

    if (!email) {
      return { success: false, message: 'Email not found' };
    }

    if (email.status !== 'PENDING') {
      return { success: false, message: `Cannot cancel email with status: ${email.status}` };
    }

    // Check if it's still within the undo window
    if (new Date() >= email.sendAt) {
      return { success: false, message: 'Undo window has expired' };
    }

    await prisma.emailOutbox.update({
      where: { id: outboxId },
      data: { status: 'CANCELLED' },
    });

    console.log(`✅ Email cancelled: ${outboxId}`);
    return { success: true, message: 'Email cancelled successfully' };
  }

  // Get pending emails for a user
  async getPendingEmails(userId: string): Promise<OutboxEmail[]> {
    return prisma.emailOutbox.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { sendAt: 'asc' },
    });
  }

  // Get scheduled emails for a user
  async getScheduledEmails(userId: string): Promise<OutboxEmail[]> {
    const now = new Date();
    return prisma.emailOutbox.findMany({
      where: {
        userId,
        status: 'PENDING',
        sendAt: { gt: new Date(now.getTime() + 60000) }, // More than 1 min in future
      },
      orderBy: { sendAt: 'asc' },
    });
  }

  // Update a scheduled email
  async updateScheduledEmail(
    outboxId: string,
    userId: string,
    updates: Partial<Pick<QueueEmailParams, 'to' | 'cc' | 'bcc' | 'subject' | 'html' | 'text' | 'scheduledAt'>>
  ): Promise<{ success: boolean; message: string }> {
    const email = await prisma.emailOutbox.findFirst({
      where: { id: outboxId, userId, status: 'PENDING' },
    });

    if (!email) {
      return { success: false, message: 'Email not found or already processed' };
    }

    await prisma.emailOutbox.update({
      where: { id: outboxId },
      data: {
        ...(updates.to && { toAddresses: updates.to }),
        ...(updates.cc && { ccAddresses: updates.cc }),
        ...(updates.bcc && { bccAddresses: updates.bcc }),
        ...(updates.subject && { subject: updates.subject }),
        ...(updates.html && { htmlBody: updates.html }),
        ...(updates.text && { textBody: updates.text }),
        ...(updates.scheduledAt && { sendAt: updates.scheduledAt }),
      },
    });

    return { success: true, message: 'Email updated' };
  }

  // Start processing the outbox
  private startProcessing() {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(() => {
      this.processOutbox().catch(console.error);
    }, 1000); // Check every second
  }

  // Stop processing
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Process pending emails
  private async processOutbox() {
    const now = new Date();

    // Find emails that are ready to send
    const readyEmails = await prisma.emailOutbox.findMany({
      where: {
        status: 'PENDING',
        sendAt: { lte: now },
      },
      take: 10, // Process up to 10 at a time
    });

    for (const email of readyEmails) {
      await this.sendEmail(email);
    }
  }

  // Actually send an email
  private async sendEmail(outboxEmail: OutboxEmail) {
    try {
      // Mark as sending
      await prisma.emailOutbox.update({
        where: { id: outboxEmail.id },
        data: { status: 'SENDING', attempts: { increment: 1 } },
      });

      // Send via SMTP
      const result = await emailService.sendEmail({
        to: outboxEmail.toAddresses,
        cc: outboxEmail.ccAddresses.length > 0 ? outboxEmail.ccAddresses : undefined,
        bcc: outboxEmail.bccAddresses.length > 0 ? outboxEmail.bccAddresses : undefined,
        subject: outboxEmail.subject,
        html: outboxEmail.htmlBody || '',
        text: outboxEmail.textBody || '',
      });

      if (result.success) {
        // Save to Sent folder
        const sentEmail = await prisma.email.create({
          data: {
            messageId: result.messageId || `<${outboxEmail.id}@exoinafrica.com>`,
            folder: 'SENT',
            fromName: outboxEmail.fromName,
            fromAddress: outboxEmail.fromAddress,
            toAddresses: outboxEmail.toAddresses,
            ccAddresses: outboxEmail.ccAddresses,
            bccAddresses: outboxEmail.bccAddresses,
            subject: outboxEmail.subject,
            htmlBody: outboxEmail.htmlBody,
            textBody: outboxEmail.textBody,
            snippet: (outboxEmail.textBody || outboxEmail.subject).substring(0, 150),
            isRead: true,
            userId: outboxEmail.userId,
          },
        });

        // Mark as sent
        await prisma.emailOutbox.update({
          where: { id: outboxEmail.id },
          data: { status: 'SENT', sentEmailId: sentEmail.id },
        });

        console.log(`✅ Email sent: ${outboxEmail.id} -> ${outboxEmail.toAddresses.join(', ')}`);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send email ${outboxEmail.id}:`, errorMessage);

      // Mark as failed (after 3 attempts)
      const email = await prisma.emailOutbox.findUnique({ where: { id: outboxEmail.id } });
      if (email && email.attempts >= 3) {
        await prisma.emailOutbox.update({
          where: { id: outboxEmail.id },
          data: { status: 'FAILED', errorMessage },
        });
      } else {
        // Retry later
        await prisma.emailOutbox.update({
          where: { id: outboxEmail.id },
          data: { 
            status: 'PENDING', 
            errorMessage,
            sendAt: new Date(Date.now() + 30000), // Retry in 30 seconds
          },
        });
      }
    }
  }

  // Get time remaining until send (for UI countdown)
  getTimeRemaining(sendAt: Date): number {
    return Math.max(0, Math.floor((sendAt.getTime() - Date.now()) / 1000));
  }
}

export const outboxService = new OutboxService();
