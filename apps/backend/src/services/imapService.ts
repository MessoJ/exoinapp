import { ImapFlow } from 'imapflow';
import { prisma } from '../index';
import { EmailFolder } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// IMAP configuration interface
interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Parsed email structure
interface ParsedEmail {
  messageId: string;
  subject: string;
  from: { name?: string; address: string };
  to: Array<{ name?: string; address: string }>;
  cc: Array<{ name?: string; address: string }>;
  bcc: Array<{ name?: string; address: string }>;
  date: Date;
  html?: string;
  text?: string;
  hasAttachments: boolean;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    contentId?: string;
  }>;
  uid: number;
  flags: string[];
}

// Folder mapping from IMAP to our system
const FOLDER_MAP: Record<string, EmailFolder> = {
  'INBOX': 'INBOX',
  'Sent': 'SENT',
  'Sent Mail': 'SENT',
  'Sent Items': 'SENT',
  'Drafts': 'DRAFTS',
  'Draft': 'DRAFTS',
  'Trash': 'TRASH',
  'Deleted': 'TRASH',
  'Deleted Items': 'TRASH',
  'Spam': 'SPAM',
  'Junk': 'SPAM',
  'Junk E-mail': 'SPAM',
  'Archive': 'ARCHIVE',
  'Archives': 'ARCHIVE',
};

class ImapService {
  private config: ImapConfig | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initConfig();
  }

  private initConfig(): void {
    const host = process.env.IMAP_HOST || process.env.SMTP_HOST;
    const port = parseInt(process.env.IMAP_PORT || '993', 10);
    const secure = process.env.IMAP_SECURE !== 'false';
    const user = process.env.IMAP_USER || process.env.SMTP_USER;
    const pass = process.env.IMAP_PASS || process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('⚠️  IMAP not configured. Email sync will be disabled.');
      this.isConfigured = false;
      return;
    }

    this.config = {
      host,
      port,
      secure,
      auth: { user, pass },
    };

    this.isConfigured = true;
    console.log('✅ IMAP service initialized');
  }

  // Create IMAP connection
  private createClient(mailboxEmail?: string, mailboxPassword?: string): ImapFlow | null {
    if (!this.config && !mailboxEmail) {
      console.error('IMAP not configured');
      return null;
    }

    const auth = mailboxEmail && mailboxPassword 
      ? { user: mailboxEmail, pass: mailboxPassword }
      : this.config!.auth;

    return new ImapFlow({
      host: this.config?.host || process.env.SMTP_HOST || 'mail.exoinafrica.com',
      port: this.config?.port || 993,
      secure: this.config?.secure ?? true,
      auth,
      logger: false, // Set to true for debug
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  // Test connection
  async testConnection(email?: string, password?: string): Promise<{ success: boolean; message: string }> {
    const client = this.createClient(email, password);
    if (!client) {
      return { success: false, message: 'IMAP not configured' };
    }

    try {
      await client.connect();
      await client.logout();
      return { success: true, message: 'IMAP connection successful' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `IMAP connection failed: ${errorMessage}` };
    }
  }

  // Get folder list
  async getFolders(email?: string, password?: string): Promise<string[]> {
    const client = this.createClient(email, password);
    if (!client) return [];

    try {
      await client.connect();
      const folderList = await client.list();
      const folders = folderList.map(f => f.path);
      await client.logout();
      return folders;
    } catch (error) {
      console.error('Failed to list folders:', error);
      return [];
    }
  }

  // Parse email address
  private parseAddress(addr: any): { name?: string; address: string } {
    if (typeof addr === 'string') {
      return { address: addr };
    }
    if (addr && typeof addr === 'object') {
      return {
        name: addr.name || undefined,
        address: addr.address || addr.email || '',
      };
    }
    return { address: '' };
  }

  // Parse address list
  private parseAddressList(addrs: any): Array<{ name?: string; address: string }> {
    if (!addrs) return [];
    if (Array.isArray(addrs)) {
      return addrs.map(a => this.parseAddress(a)).filter(a => a.address);
    }
    if (addrs.value && Array.isArray(addrs.value)) {
      return addrs.value.map((a: any) => this.parseAddress(a)).filter((a: any) => a.address);
    }
    return [this.parseAddress(addrs)].filter(a => a.address);
  }

  // Sync folder for a user
  async syncFolder(
    userId: string,
    userEmail: string,
    userPassword: string,
    folderName: string = 'INBOX',
    limit: number = 50
  ): Promise<{ synced: number; errors: number }> {
    const client = this.createClient(userEmail, userPassword);
    if (!client) {
      return { synced: 0, errors: 1 };
    }

    let synced = 0;
    let errors = 0;

    try {
      await client.connect();
      
      // Map folder name
      const targetFolder = FOLDER_MAP[folderName] || 'INBOX';
      
      // Try to open the folder
      let mailbox;
      try {
        mailbox = await client.mailboxOpen(folderName);
      } catch {
        // Try common folder names
        const variations = [
          folderName,
          folderName.toUpperCase(),
          folderName.toLowerCase(),
        ];
        
        let opened = false;
        for (const variation of variations) {
          try {
            mailbox = await client.mailboxOpen(variation);
            opened = true;
            break;
          } catch {}
        }
        
        if (!opened || !mailbox) {
          console.error(`Could not open folder: ${folderName}`);
          await client.logout();
          return { synced: 0, errors: 1 };
        }
      }

      // Get existing message IDs for this user/folder to avoid duplicates
      const existingEmails = await prisma.email.findMany({
        where: { userId, folder: targetFolder },
        select: { messageId: true },
      });
      const existingIds = new Set(existingEmails.map(e => e.messageId));

      // Calculate range for fetching
      const totalMessages = mailbox.exists || 0;
      if (totalMessages === 0) {
        await client.logout();
        return { synced: 0, errors: 0 };
      }

      const startSeq = Math.max(1, totalMessages - limit + 1);
      
      // Fetch recent messages
      const messages: ParsedEmail[] = [];
      
      for await (const message of client.fetch(`${startSeq}:*`, {
        envelope: true,
        source: true,
        bodyStructure: true,
        flags: true,
      })) {
        try {
          const envelope = message.envelope;
          if (!envelope) continue;
          
          const msgId = envelope.messageId || `<imap-${message.uid}@${userEmail.split('@')[1]}>`;
          
          // Skip if already synced
          if (existingIds.has(msgId)) continue;

          // Parse the message
          const from = this.parseAddressList(envelope.from)[0] || { address: 'unknown@unknown.com' };
          const to = this.parseAddressList(envelope.to);
          const cc = this.parseAddressList(envelope.cc);
          
          // Get body
          let html = '';
          let text = '';
          
          if (message.source) {
            const sourceStr = message.source.toString();
            // Simple parsing - extract text between body tags or use plain text
            const htmlMatch = sourceStr.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
            if (htmlMatch) {
              html = htmlMatch[0];
            }
            
            // Try to extract plain text
            const textParts = sourceStr.split(/\r?\n\r?\n/);
            if (textParts.length > 1) {
              text = textParts.slice(1).join('\n\n').substring(0, 5000);
            }
          }

          // Check for attachments
          const hasAttachments = (message.bodyStructure as any)?.childNodes?.some(
            (node: any) => node.disposition === 'attachment'
          ) || false;

          const attachments: any[] = [];
          const bodyStructure = message.bodyStructure as any;
          if (bodyStructure?.childNodes) {
            for (const node of bodyStructure.childNodes) {
              if (node.disposition === 'attachment' || 
                  (node.type && node.type !== 'text' && node.type !== 'multipart')) {
                attachments.push({
                  filename: node.dispositionParameters?.filename || node.parameters?.name || 'attachment',
                  mimeType: node.type ? `${node.type}/${(node as any).subtype || ''}` : 'application/octet-stream',
                  size: node.size || 0,
                });
              }
            }
          }

          messages.push({
            messageId: msgId,
            subject: envelope.subject || '(No subject)',
            from,
            to,
            cc,
            bcc: [],
            date: envelope.date || new Date(),
            html,
            text,
            hasAttachments,
            attachments,
            uid: message.uid,
            flags: Array.from(message.flags || []),
          });
        } catch (parseError) {
          console.error('Error parsing message:', parseError);
          errors++;
        }
      }

      // Save to database
      for (const msg of messages) {
        try {
          await prisma.email.create({
            data: {
              messageId: msg.messageId,
              folder: targetFolder,
              fromName: msg.from.name || msg.from.address.split('@')[0],
              fromAddress: msg.from.address,
              toAddresses: msg.to.map(t => t.address),
              ccAddresses: msg.cc.map(t => t.address),
              bccAddresses: [],
              subject: msg.subject,
              htmlBody: msg.html || undefined,
              textBody: msg.text,
              snippet: msg.text?.substring(0, 150) || msg.subject.substring(0, 150),
              isRead: msg.flags.includes('\\Seen'),
              isStarred: msg.flags.includes('\\Flagged'),
              hasAttachments: msg.hasAttachments,
              sentAt: msg.date,
              userId,
              priority: msg.flags.includes('$Important') ? 'high' : 'normal',
            },
          });

          // Create attachments
          if (msg.attachments.length > 0) {
            const email = await prisma.email.findFirst({
              where: { messageId: msg.messageId, userId },
            });
            
            if (email) {
              for (const att of msg.attachments) {
                await prisma.emailAttachment.create({
                  data: {
                    emailId: email.id,
                    filename: att.filename,
                    mimeType: att.mimeType,
                    size: att.size,
                    url: undefined, // Will be populated when downloaded
                  },
                });
              }
            }
          }

          synced++;
        } catch (dbError) {
          console.error('Error saving email:', dbError);
          errors++;
        }
      }

      await client.logout();
    } catch (error) {
      console.error('IMAP sync error:', error);
      errors++;
    }

    return { synced, errors };
  }

  // Sync all standard folders
  async syncAllFolders(
    userId: string,
    userEmail: string,
    userPassword: string
  ): Promise<{ folders: Record<string, { synced: number; errors: number }>; total: number }> {
    const foldersToSync = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam', 'Archive'];
    const results: Record<string, { synced: number; errors: number }> = {};
    let total = 0;

    for (const folder of foldersToSync) {
      const result = await this.syncFolder(userId, userEmail, userPassword, folder, 50);
      results[folder] = result;
      total += result.synced;
    }

    return { folders: results, total };
  }

  // Get status
  getStatus(): { configured: boolean; host: string } {
    return {
      configured: this.isConfigured,
      host: this.config?.host || 'Not configured',
    };
  }
}

// Export singleton instance
export const imapService = new ImapService();

// Export class for testing
export { ImapService };
