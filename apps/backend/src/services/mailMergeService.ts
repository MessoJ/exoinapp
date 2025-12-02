import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { emailTrackingService } from './emailTrackingService';
import { outboxService } from './outboxService';

interface MailMergeRecipient {
  email: string;
  [key: string]: string;
}

interface CreateMailMergeParams {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: MailMergeRecipient[];
  scheduledAt?: Date;
  userId: string;
}

interface MergeField {
  field: string;
  sampleValue: string;
}

class MailMergeService {
  /**
   * Parse CSV content to array of recipients
   */
  parseCSV(csvContent: string): MailMergeRecipient[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = this.parseCSVLine(lines[0]);
    const recipients: MailMergeRecipient[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const recipient: MailMergeRecipient = { email: '' };
      headers.forEach((header, idx) => {
        const key = header.toLowerCase().trim();
        recipient[key] = values[idx];
        // Map common email column names
        if (key === 'email' || key === 'e-mail' || key === 'email_address') {
          recipient.email = values[idx];
        }
      });

      if (recipient.email) {
        recipients.push(recipient);
      }
    }

    return recipients;
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Extract merge fields from content (e.g., {{name}}, {{company}})
   */
  extractMergeFields(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const fields: Set<string> = new Set();
    let match;

    while ((match = regex.exec(content)) !== null) {
      fields.add(match[1].trim().toLowerCase());
    }

    return Array.from(fields);
  }

  /**
   * Validate that recipients have all required merge fields
   */
  validateRecipients(
    recipients: MailMergeRecipient[],
    requiredFields: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    recipients.forEach((recipient, idx) => {
      requiredFields.forEach(field => {
        if (!recipient[field]) {
          errors.push(`Row ${idx + 1}: Missing field "${field}" for ${recipient.email}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge content with recipient data
   */
  mergeContent(content: string, recipient: MailMergeRecipient): string {
    let merged = content;
    
    Object.entries(recipient).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      merged = merged.replace(regex, value);
    });

    return merged;
  }

  /**
   * Create a new mail merge campaign
   */
  async createMailMerge(params: CreateMailMergeParams): Promise<any> {
    const {
      name,
      subject,
      htmlBody,
      recipients,
      scheduledAt,
      userId,
    } = params;

    // Create mail merge record
    const mailMerge = await prisma.mailMerge.create({
      data: {
        name,
        subject,
        htmlBody,
        recipients: recipients as any, // JSON field
        recipientCount: recipients.length,
        scheduledAt,
        userId,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return mailMerge;
  }

  /**
   * Start sending a mail merge campaign
   */
  async startMailMerge(mailMergeId: string, userId: string): Promise<boolean> {
    try {
      const mailMerge = await prisma.mailMerge.findFirst({
        where: { id: mailMergeId, userId },
      });

      if (!mailMerge || mailMerge.status === 'SENDING' || mailMerge.status === 'COMPLETED') {
        return false;
      }

      // Update status to sending
      await prisma.mailMerge.update({
        where: { id: mailMergeId },
        data: { status: 'SENDING', startedAt: new Date() },
      });

      // Parse recipients from JSON
      const recipients = mailMerge.recipients as unknown as MailMergeRecipient[];
      const htmlBody = mailMerge.htmlBody || '';

      // Send to each recipient
      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          // Merge content
          const mergedSubject = this.mergeContent(mailMerge.subject, recipient);
          const mergedContent = this.mergeContent(htmlBody, recipient);

          // Create outbox entry - need sender email from user
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true },
          });

          if (user) {
            await outboxService.queueEmail({
              userId,
              fromAddress: user.email,
              fromName: `${user.firstName} ${user.lastName}`.trim() || undefined,
              to: [recipient.email],
              subject: mergedSubject,
              html: mergedContent,
              undoDelaySeconds: 0, // Send immediately
            });
          }

          sentCount++;
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          failedCount++;
        }

        // Update progress
        await prisma.mailMerge.update({
          where: { id: mailMergeId },
          data: {
            sentCount,
            failedCount,
          },
        });
      }

      // Mark as completed
      await prisma.mailMerge.update({
        where: { id: mailMergeId },
        data: {
          status: failedCount === recipients.length ? 'FAILED' : 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Start mail merge error:', error);
      
      await prisma.mailMerge.update({
        where: { id: mailMergeId },
        data: { status: 'FAILED' },
      });

      return false;
    }
  }

  /**
   * Get mail merge by ID
   */
  async getMailMerge(mailMergeId: string, userId: string): Promise<any | null> {
    return prisma.mailMerge.findFirst({
      where: { id: mailMergeId, userId },
    });
  }

  /**
   * Get all mail merges for user
   */
  async getUserMailMerges(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ campaigns: any[]; total: number; page: number; pages: number }> {
    const [total, campaigns] = await Promise.all([
      prisma.mailMerge.count({ where: { userId } }),
      prisma.mailMerge.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          subject: true,
          recipientCount: true,
          sentCount: true,
          failedCount: true,
          status: true,
          scheduledAt: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      campaigns,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Cancel a mail merge campaign
   */
  async cancelMailMerge(mailMergeId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.mailMerge.updateMany({
        where: {
          id: mailMergeId,
          userId,
          status: { in: ['DRAFT', 'SCHEDULED'] },
        },
        data: { status: 'CANCELLED' },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Cancel mail merge error:', error);
      return false;
    }
  }

  /**
   * Delete a mail merge campaign
   */
  async deleteMailMerge(mailMergeId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.mailMerge.deleteMany({
        where: {
          id: mailMergeId,
          userId,
          status: { in: ['DRAFT', 'CANCELLED', 'COMPLETED', 'FAILED'] },
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Delete mail merge error:', error);
      return false;
    }
  }

  /**
   * Preview mail merge for a recipient
   */
  previewMailMerge(
    subject: string,
    content: string,
    recipient: MailMergeRecipient
  ): { subject: string; content: string } {
    return {
      subject: this.mergeContent(subject, recipient),
      content: this.mergeContent(content, recipient),
    };
  }

  /**
   * Get sample merge fields from CSV
   */
  getSampleMergeFields(recipients: MailMergeRecipient[]): MergeField[] {
    if (recipients.length === 0) return [];

    const firstRecipient = recipients[0];
    return Object.entries(firstRecipient).map(([field, sampleValue]) => ({
      field,
      sampleValue: String(sampleValue),
    }));
  }
}

export const mailMergeService = new MailMergeService();
