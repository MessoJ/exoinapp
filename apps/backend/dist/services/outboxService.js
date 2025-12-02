"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxService = void 0;
const index_1 = require("../index");
const emailService_1 = require("./emailService");
// Default delay for undo send (in seconds)
const DEFAULT_UNDO_DELAY = 10;
class OutboxService {
    constructor() {
        this.processingInterval = null;
        // Start processing outbox every second
        this.startProcessing();
        console.log('📤 Outbox service initialized');
    }
    // Queue an email for sending (with undo delay)
    async queueEmail(params) {
        const { userId, fromName, fromAddress, to, cc = [], bcc = [], subject, html, text, undoDelaySeconds = DEFAULT_UNDO_DELAY, scheduledAt, } = params;
        // Calculate send time
        const sendAt = scheduledAt || new Date(Date.now() + undoDelaySeconds * 1000);
        const isScheduled = scheduledAt && scheduledAt > new Date(Date.now() + 60000); // More than 1 min in future
        const outboxEmail = await index_1.prisma.emailOutbox.create({
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
    async cancelEmail(outboxId, userId) {
        const email = await index_1.prisma.emailOutbox.findFirst({
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
        await index_1.prisma.emailOutbox.update({
            where: { id: outboxId },
            data: { status: 'CANCELLED' },
        });
        console.log(`✅ Email cancelled: ${outboxId}`);
        return { success: true, message: 'Email cancelled successfully' };
    }
    // Get pending emails for a user
    async getPendingEmails(userId) {
        return index_1.prisma.emailOutbox.findMany({
            where: { userId, status: 'PENDING' },
            orderBy: { sendAt: 'asc' },
        });
    }
    // Get scheduled emails for a user
    async getScheduledEmails(userId) {
        const now = new Date();
        return index_1.prisma.emailOutbox.findMany({
            where: {
                userId,
                status: 'PENDING',
                sendAt: { gt: new Date(now.getTime() + 60000) }, // More than 1 min in future
            },
            orderBy: { sendAt: 'asc' },
        });
    }
    // Update a scheduled email
    async updateScheduledEmail(outboxId, userId, updates) {
        const email = await index_1.prisma.emailOutbox.findFirst({
            where: { id: outboxId, userId, status: 'PENDING' },
        });
        if (!email) {
            return { success: false, message: 'Email not found or already processed' };
        }
        await index_1.prisma.emailOutbox.update({
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
    startProcessing() {
        if (this.processingInterval)
            return;
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
    async processOutbox() {
        const now = new Date();
        // Find emails that are ready to send
        const readyEmails = await index_1.prisma.emailOutbox.findMany({
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
    async sendEmail(outboxEmail) {
        try {
            // Mark as sending
            await index_1.prisma.emailOutbox.update({
                where: { id: outboxEmail.id },
                data: { status: 'SENDING', attempts: { increment: 1 } },
            });
            // Send via SMTP
            const result = await emailService_1.emailService.sendEmail({
                to: outboxEmail.toAddresses,
                cc: outboxEmail.ccAddresses.length > 0 ? outboxEmail.ccAddresses : undefined,
                bcc: outboxEmail.bccAddresses.length > 0 ? outboxEmail.bccAddresses : undefined,
                subject: outboxEmail.subject,
                html: outboxEmail.htmlBody || '',
                text: outboxEmail.textBody || '',
            });
            if (result.success) {
                // Save to Sent folder
                const sentEmail = await index_1.prisma.email.create({
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
                await index_1.prisma.emailOutbox.update({
                    where: { id: outboxEmail.id },
                    data: { status: 'SENT', sentEmailId: sentEmail.id },
                });
                console.log(`✅ Email sent: ${outboxEmail.id} -> ${outboxEmail.toAddresses.join(', ')}`);
            }
            else {
                throw new Error(result.error || 'Failed to send email');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Failed to send email ${outboxEmail.id}:`, errorMessage);
            // Mark as failed (after 3 attempts)
            const email = await index_1.prisma.emailOutbox.findUnique({ where: { id: outboxEmail.id } });
            if (email && email.attempts >= 3) {
                await index_1.prisma.emailOutbox.update({
                    where: { id: outboxEmail.id },
                    data: { status: 'FAILED', errorMessage },
                });
            }
            else {
                // Retry later
                await index_1.prisma.emailOutbox.update({
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
    getTimeRemaining(sendAt) {
        return Math.max(0, Math.floor((sendAt.getTime() - Date.now()) / 1000));
    }
}
exports.outboxService = new OutboxService();
