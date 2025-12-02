"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailSyncService = void 0;
exports.encryptPassword = encryptPassword;
exports.decryptPassword = decryptPassword;
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const index_1 = require("../index");
const crypto_1 = __importDefault(require("crypto"));
// Encryption key for mail passwords - MUST be exactly 32 bytes for AES-256
// Use SHA-256 hash to ensure consistent 32-byte key from any input
const RAW_KEY = process.env.MAIL_ENCRYPTION_KEY || 'exoin-mail-secret-key-2024';
const ENCRYPTION_KEY = crypto_1.default.createHash('sha256').update(RAW_KEY).digest();
const ENCRYPTION_IV_LENGTH = 16;
// Helper to encrypt password
function encryptPassword(password) {
    const iv = crypto_1.default.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
// Helper to decrypt password
function decryptPassword(encryptedPassword) {
    const parts = encryptedPassword.split(':');
    if (parts.length !== 2)
        throw new Error('Invalid encrypted password format');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
// Get mail server config from env
function getMailServerConfig() {
    return {
        imapHost: process.env.SMTP_HOST || 'mail.exoinafrica.com',
        imapPort: parseInt(process.env.IMAP_PORT || '993'),
        smtpHost: process.env.SMTP_HOST || 'mail.exoinafrica.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
    };
}
// Folder name mapping (Mailu uses standard names)
const IMAP_TO_DB_FOLDER = {
    'INBOX': 'INBOX',
    'Sent': 'SENT',
    'Drafts': 'DRAFTS',
    'Trash': 'TRASH',
    'Junk': 'SPAM',
    'Archive': 'ARCHIVE',
};
const DB_TO_IMAP_FOLDER = {
    'INBOX': 'INBOX',
    'SENT': 'Sent',
    'DRAFTS': 'Drafts',
    'TRASH': 'Trash',
    'SPAM': 'Junk',
    'ARCHIVE': 'Archive',
};
// Extract address from mailparser AddressObject
function extractAddresses(addressObj) {
    if (!addressObj)
        return [];
    const addresses = Array.isArray(addressObj) ? addressObj : [addressObj];
    const result = [];
    for (const addr of addresses) {
        if (addr.value) {
            for (const v of addr.value) {
                if (v.address) {
                    result.push({ name: v.name, address: v.address });
                }
            }
        }
    }
    return result;
}
// Mail Sync Service Class
class MailSyncService {
    constructor() {
        this.config = getMailServerConfig();
        console.log(`📧 Mail Sync Service initialized - Server: ${this.config.imapHost}:${this.config.imapPort}`);
    }
    // Create IMAP client for a user
    createClient(email, password) {
        console.log(`🔌 Creating IMAP client for ${email} -> ${this.config.imapHost}:${this.config.imapPort}`);
        return new imapflow_1.ImapFlow({
            host: this.config.imapHost,
            port: this.config.imapPort,
            secure: true, // Use TLS
            auth: { user: email, pass: password },
            logger: false,
            tls: {
                rejectUnauthorized: false, // Accept Mailu's certificate
                minVersion: 'TLSv1.2',
            },
            greetingTimeout: 45000, // 45 second timeout
            socketTimeout: 90000, // 90 second socket timeout
            disableCompression: true, // Disable compression for stability
        });
    }
    // Helper to execute IMAP operations with retry logic
    async withRetry(operation, operationName = 'operation', maxRetries = 3, delayMs = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                const isRetryable = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE'].includes(error?.code);
                if (isRetryable && attempt < maxRetries) {
                    console.log(`⚠️ ${operationName}: Connection error (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    delayMs *= 2; // Exponential backoff
                }
                else {
                    throw error;
                }
            }
        }
        throw lastError;
    }
    // Test connection for a user
    async testConnection(email, password) {
        console.log(`🧪 Testing IMAP connection for ${email}...`);
        const client = this.createClient(email, password);
        try {
            console.log('  → Connecting to server...');
            await client.connect();
            console.log('  ✓ Connected successfully');
            // List folders to verify access
            console.log('  → Listing folders...');
            const folderList = await client.list();
            const folders = folderList.map(f => f.path);
            console.log(`  ✓ Found ${folders.length} folders:`, folders.slice(0, 5));
            await client.logout();
            console.log('  ✓ Logged out cleanly');
            return {
                success: true,
                message: 'Connected successfully to mail server',
                folders
            };
        }
        catch (error) {
            const errorMsg = error?.message || error?.text || 'Unknown error';
            const errorCode = error?.code || '';
            const responseText = error?.responseText || '';
            console.error('❌ IMAP connection failed:');
            console.error('   Message:', errorMsg);
            console.error('   Code:', errorCode);
            console.error('   Response:', responseText);
            // Provide user-friendly error messages
            let userMessage = `Connection failed: ${errorMsg}`;
            if (errorMsg.includes('Authentication failed') || errorMsg.includes('Invalid credentials')) {
                userMessage = 'Incorrect password. Please check your email password and try again.';
            }
            else if (errorMsg.includes('ECONNREFUSED')) {
                userMessage = 'Cannot reach mail server. Please check your network connection.';
            }
            else if (errorMsg.includes('ETIMEDOUT')) {
                userMessage = 'Connection timed out. The mail server may be busy.';
            }
            else if (errorMsg.includes('ECONNRESET') || errorCode === 'ECONNRESET') {
                userMessage = 'Connection was reset by the mail server. Please try again in a few seconds.';
            }
            else if (errorMsg.includes('certificate')) {
                userMessage = 'SSL certificate issue with mail server.';
            }
            return {
                success: false,
                message: userMessage,
                debug: `${errorCode}: ${errorMsg} - ${responseText}`.trim()
            };
        }
    }
    // Save user's mail credentials (encrypted)
    async saveMailCredentials(userId, email, password) {
        console.log(`💾 Saving mail credentials for user ${userId} (${email})`);
        // First test the connection
        const testResult = await this.testConnection(email, password);
        if (!testResult.success) {
            return testResult;
        }
        // Encrypt and save password
        try {
            const encryptedPassword = encryptPassword(password);
            console.log('  ✓ Password encrypted successfully');
            await index_1.prisma.user.update({
                where: { id: userId },
                data: { mailPassword: encryptedPassword },
            });
            console.log('  ✓ Credentials saved to database');
            return { success: true, message: 'Mail credentials saved successfully' };
        }
        catch (error) {
            console.error('❌ Failed to save credentials:', error);
            return { success: false, message: `Failed to save: ${error.message}` };
        }
    }
    // Get user's mail credentials
    async getMailCredentials(userId) {
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, mailPassword: true },
        });
        if (!user || !user.mailPassword) {
            return null;
        }
        try {
            const password = decryptPassword(user.mailPassword);
            return { email: user.email, password };
        }
        catch {
            return null;
        }
    }
    // Sync a specific folder
    async syncFolder(userId, email, password, folderName = 'INBOX', limit = 100) {
        const client = this.createClient(email, password);
        const imapFolder = DB_TO_IMAP_FOLDER[folderName] || 'INBOX';
        let synced = 0;
        let errors = 0;
        try {
            await client.connect();
            // Open the folder
            let mailbox;
            try {
                mailbox = await client.mailboxOpen(imapFolder);
            }
            catch {
                // Try fallback folder names
                try {
                    mailbox = await client.mailboxOpen(imapFolder.toUpperCase());
                }
                catch {
                    console.log(`Folder ${imapFolder} not found, skipping`);
                    await client.logout();
                    return { synced: 0, errors: 0, total: 0 };
                }
            }
            const totalMessages = mailbox.exists || 0;
            if (totalMessages === 0) {
                await client.logout();
                return { synced: 0, errors: 0, total: 0 };
            }
            // Get existing message IDs to avoid duplicates
            const existingEmails = await index_1.prisma.email.findMany({
                where: { userId, folder: folderName },
                select: { messageId: true },
            });
            const existingIds = new Set(existingEmails.map(e => e.messageId));
            // Calculate fetch range (last N messages)
            const startSeq = Math.max(1, totalMessages - limit + 1);
            // Fetch messages with full source for proper parsing
            for await (const message of client.fetch(`${startSeq}:*`, {
                uid: true,
                flags: true,
                envelope: true,
                source: true,
            })) {
                try {
                    // Skip if no source
                    if (!message.source)
                        continue;
                    // Parse email using mailparser
                    const parsed = await (0, mailparser_1.simpleParser)(message.source);
                    // Generate message ID
                    const messageId = parsed.messageId || `<${message.uid}@${email.split('@')[1]}>`;
                    // Skip if already synced (check both folder-specific and global)
                    if (existingIds.has(messageId))
                        continue;
                    // Also check if this messageId exists globally (to avoid unique constraint error)
                    const existsGlobally = await index_1.prisma.email.findUnique({
                        where: { messageId },
                        select: { id: true }
                    });
                    if (existsGlobally) {
                        existingIds.add(messageId); // Add to set to skip future iterations
                        continue;
                    }
                    // Extract addresses
                    const fromAddrs = extractAddresses(parsed.from);
                    const toAddrs = extractAddresses(parsed.to);
                    const ccAddrs = extractAddresses(parsed.cc);
                    const bccAddrs = extractAddresses(parsed.bcc);
                    const from = fromAddrs[0] || { address: 'unknown@unknown.com' };
                    // Check for attachments
                    const hasAttachments = parsed.attachments && parsed.attachments.length > 0;
                    // Get flags
                    const flags = message.flags ? Array.from(message.flags) : [];
                    const isRead = flags.includes('\\Seen');
                    const isStarred = flags.includes('\\Flagged');
                    // Create or update email record (upsert to handle race conditions)
                    const emailData = {
                        folder: folderName,
                        fromName: from.name || from.address.split('@')[0],
                        fromAddress: from.address,
                        toAddresses: toAddrs.map(a => a.address),
                        ccAddresses: ccAddrs.map(a => a.address),
                        bccAddresses: bccAddrs.map(a => a.address),
                        subject: parsed.subject || '(No subject)',
                        htmlBody: parsed.html || undefined,
                        textBody: parsed.text || undefined,
                        snippet: (parsed.text || parsed.subject || '').substring(0, 200),
                        isRead,
                        isStarred,
                        hasAttachments: hasAttachments || false,
                        sentAt: parsed.date || new Date(),
                        userId,
                        priority: flags.includes('$Important') || flags.includes('\\Flagged') ? 'high' : 'normal',
                    };
                    const emailRecord = await index_1.prisma.email.upsert({
                        where: { messageId },
                        update: { isRead, isStarred }, // Only update flags on duplicate
                        create: { messageId, ...emailData },
                    });
                    // Save attachments metadata
                    if (parsed.attachments && parsed.attachments.length > 0) {
                        for (const att of parsed.attachments) {
                            await index_1.prisma.emailAttachment.create({
                                data: {
                                    emailId: emailRecord.id,
                                    filename: att.filename || 'attachment',
                                    mimeType: att.contentType || 'application/octet-stream',
                                    size: att.size || 0,
                                    // Store attachment content as base64 for now (or use MinIO in production)
                                    url: att.content ? `data:${att.contentType};base64,${att.content.toString('base64')}` : undefined,
                                },
                            });
                        }
                    }
                    synced++;
                    existingIds.add(messageId); // Prevent duplicates in same run
                }
                catch (parseError) {
                    console.error('Error parsing email:', parseError);
                    errors++;
                }
            }
            await client.logout();
        }
        catch (error) {
            console.error('Sync error:', error);
            errors++;
        }
        return { synced, errors, total: synced + errors };
    }
    // Sync all folders for a user
    async syncAllFolders(userId, email, password) {
        const foldersToSync = ['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM'];
        const results = {};
        let totalSynced = 0;
        for (const folder of foldersToSync) {
            const result = await this.syncFolder(userId, email, password, folder, 100);
            results[folder] = { synced: result.synced, errors: result.errors };
            totalSynced += result.synced;
        }
        return { success: true, folders: results, totalSynced };
    }
    // Quick sync - just sync INBOX
    async quickSync(userId) {
        const creds = await this.getMailCredentials(userId);
        if (!creds) {
            return { synced: 0, error: 'Mail credentials not configured' };
        }
        try {
            const result = await this.withRetry(async () => this.syncFolder(userId, creds.email, creds.password, 'INBOX', 50), 'quickSync');
            return { synced: result.synced };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
            console.error('Quick sync failed after retries:', errorMessage);
            return { synced: 0, error: errorMessage };
        }
    }
    // Check for new mail (lightweight)
    async checkNewMail(userId) {
        const creds = await this.getMailCredentials(userId);
        if (!creds) {
            return { hasNew: false, count: 0 };
        }
        try {
            return await this.withRetry(async () => {
                const client = this.createClient(creds.email, creds.password);
                try {
                    await client.connect();
                    await client.mailboxOpen('INBOX');
                    // Get unseen count by searching for unseen messages (seen: false)
                    const searchResults = await client.search({ seen: false });
                    const unseen = Array.isArray(searchResults) ? searchResults.length : 0;
                    await client.logout();
                    return { hasNew: unseen > 0, count: unseen };
                }
                catch (error) {
                    try {
                        await client.logout();
                    }
                    catch { }
                    throw error;
                }
            }, 'checkNewMail');
        }
        catch {
            return { hasNew: false, count: 0 };
        }
    }
    // Move email on server
    async moveEmail(userId, messageId, targetFolder) {
        const creds = await this.getMailCredentials(userId);
        if (!creds)
            return false;
        // Get the email to find its UID
        const email = await index_1.prisma.email.findFirst({
            where: { messageId, userId },
        });
        if (!email)
            return false;
        const imapTarget = DB_TO_IMAP_FOLDER[targetFolder];
        const imapSource = DB_TO_IMAP_FOLDER[email.folder];
        try {
            return await this.withRetry(async () => {
                const client = this.createClient(creds.email, creds.password);
                try {
                    await client.connect();
                    await client.mailboxOpen(imapSource);
                    // Search for the message by Message-ID header
                    const searchResults = await client.search({ header: { 'Message-ID': messageId } });
                    if (Array.isArray(searchResults) && searchResults.length > 0) {
                        await client.messageMove(searchResults, imapTarget);
                    }
                    await client.logout();
                    return true;
                }
                catch (error) {
                    try {
                        await client.logout();
                    }
                    catch { }
                    throw error;
                }
            }, 'moveEmail');
        }
        catch (error) {
            console.error('Move email error:', error);
            return false;
        }
    }
    // Delete email from server (move to Trash)
    async deleteEmail(userId, messageId) {
        return this.moveEmail(userId, messageId, 'TRASH');
    }
    // Mark email as read/unread on server
    async markAsRead(userId, messageId, isRead) {
        const creds = await this.getMailCredentials(userId);
        if (!creds)
            return false;
        const email = await index_1.prisma.email.findFirst({
            where: { messageId, userId },
        });
        if (!email)
            return false;
        const imapFolder = DB_TO_IMAP_FOLDER[email.folder];
        try {
            return await this.withRetry(async () => {
                const client = this.createClient(creds.email, creds.password);
                try {
                    await client.connect();
                    await client.mailboxOpen(imapFolder);
                    const searchResults = await client.search({ header: { 'Message-ID': messageId } });
                    if (Array.isArray(searchResults) && searchResults.length > 0) {
                        if (isRead) {
                            await client.messageFlagsAdd(searchResults, ['\\Seen']);
                        }
                        else {
                            await client.messageFlagsRemove(searchResults, ['\\Seen']);
                        }
                    }
                    await client.logout();
                    return true;
                }
                catch (error) {
                    try {
                        await client.logout();
                    }
                    catch { }
                    throw error;
                }
            }, 'markAsRead');
        }
        catch (error) {
            console.error('Mark as read error:', error);
            return false;
        }
    }
    // Fetch attachment content from mail server
    async fetchAttachment(userId, messageId, attachmentId) {
        const creds = await this.getMailCredentials(userId);
        if (!creds)
            return null;
        const email = await index_1.prisma.email.findFirst({
            where: { messageId, userId },
            include: { attachments: true }
        });
        if (!email)
            return null;
        const attachment = email.attachments.find(a => a.id === attachmentId);
        if (!attachment)
            return null;
        const client = this.createClient(creds.email, creds.password);
        const imapFolder = DB_TO_IMAP_FOLDER[email.folder];
        try {
            await client.connect();
            await client.mailboxOpen(imapFolder);
            // Search for the message by Message-ID
            const searchResults = await client.search({ header: { 'Message-ID': messageId } });
            if (!Array.isArray(searchResults) || searchResults.length === 0) {
                await client.logout();
                return null;
            }
            const uid = searchResults[0];
            // Fetch the full message and parse it
            const fetchResult = await client.fetchOne(uid, { source: true });
            if (!fetchResult || !fetchResult.source) {
                await client.logout();
                return null;
            }
            // Parse the email to extract attachments
            const parsed = await (0, mailparser_1.simpleParser)(fetchResult.source);
            // Find the matching attachment by filename and size
            const matchingAttachment = parsed.attachments?.find(att => att.filename === attachment.filename || att.size === attachment.size);
            await client.logout();
            if (matchingAttachment?.content) {
                return matchingAttachment.content;
            }
            return null;
        }
        catch (error) {
            console.error('Fetch attachment error:', error);
            return null;
        }
    }
}
// Export singleton
exports.mailSyncService = new MailSyncService();
