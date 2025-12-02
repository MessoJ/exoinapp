"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mailRoutes;
const index_1 = require("../index");
const uuid_1 = require("uuid");
const emailService_1 = require("../services/emailService");
const mailSyncService_1 = require("../services/mailSyncService");
const outboxService_1 = require("../services/outboxService");
const snoozeService_1 = require("../services/snoozeService");
const priorityService_1 = require("../services/priorityService");
const Minio = __importStar(require("minio"));
// MinIO client for document attachments
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});
const BUCKET_NAME = 'exoin-assets';
// ==========================================
// SNOOZE PRESET TIME CALCULATOR
// ==========================================
function calculatePresetTime(preset, now) {
    let time;
    let display;
    switch (preset) {
        case 'LATER_TODAY': {
            const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
            const sixPm = new Date(now);
            sixPm.setHours(18, 0, 0, 0);
            if (now.getHours() >= 18) {
                const tomorrow8am = new Date(now);
                tomorrow8am.setDate(tomorrow8am.getDate() + 1);
                tomorrow8am.setHours(8, 0, 0, 0);
                time = tomorrow8am;
                display = 'Tomorrow, 8:00 AM';
            }
            else {
                time = threeHoursLater > sixPm ? threeHoursLater : sixPm;
                display = `Today, ${time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
            }
            break;
        }
        case 'TOMORROW': {
            time = new Date(now);
            time.setDate(time.getDate() + 1);
            time.setHours(8, 0, 0, 0);
            display = 'Tomorrow, 8:00 AM';
            break;
        }
        case 'THIS_WEEKEND': {
            time = new Date(now);
            const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
            time.setDate(time.getDate() + daysUntilSaturday);
            time.setHours(9, 0, 0, 0);
            display = `Saturday, 9:00 AM`;
            break;
        }
        case 'NEXT_WEEK': {
            time = new Date(now);
            const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
            time.setDate(time.getDate() + daysUntilMonday);
            time.setHours(8, 0, 0, 0);
            display = 'Monday, 8:00 AM';
            break;
        }
        default:
            time = new Date(now);
            time.setDate(time.getDate() + 1);
            time.setHours(8, 0, 0, 0);
            display = 'Tomorrow, 8:00 AM';
    }
    return { iso: time.toISOString(), display };
}
function parseSearchQuery(query) {
    const result = {
        text: [],
        from: [],
        to: [],
        subject: [],
        hasAttachment: false,
        attachmentType: [],
        isStarred: null,
        isRead: null,
        labels: [],
        folder: null,
        before: null,
        after: null,
        olderThan: null,
        newerThan: null,
        excluded: [],
    };
    // Match quoted strings and operators
    const regex = /(-?)(\w+):(?:"([^"]+)"|(\S+))|"([^"]+)"|(-?)(\S+)/g;
    let match;
    while ((match = regex.exec(query)) !== null) {
        const negated = match[1] === '-' || match[6] === '-';
        const operator = match[2]?.toLowerCase();
        const quotedValue = match[3] || match[5];
        const unquotedValue = match[4] || match[7];
        const value = quotedValue || unquotedValue || '';
        if (operator) {
            // Handle operators
            switch (operator) {
                case 'from':
                    result.from.push(value);
                    break;
                case 'to':
                    result.to.push(value);
                    break;
                case 'subject':
                    result.subject.push(value);
                    break;
                case 'has':
                    if (value === 'attachment') {
                        result.hasAttachment = true;
                    }
                    else {
                        result.attachmentType.push(value);
                    }
                    break;
                case 'is':
                    if (value === 'starred')
                        result.isStarred = true;
                    else if (value === 'unstarred')
                        result.isStarred = false;
                    else if (value === 'read')
                        result.isRead = true;
                    else if (value === 'unread')
                        result.isRead = false;
                    break;
                case 'label':
                    result.labels.push(value);
                    break;
                case 'in':
                case 'folder':
                    result.folder = value.toUpperCase();
                    break;
                case 'before':
                    result.before = parseDate(value);
                    break;
                case 'after':
                    result.after = parseDate(value);
                    break;
                case 'older_than':
                    result.olderThan = value;
                    break;
                case 'newer_than':
                    result.newerThan = value;
                    break;
                default:
                    // Unknown operator, treat as text
                    result.text.push(`${operator}:${value}`);
            }
        }
        else if (value) {
            // Plain text or quoted string
            if (negated) {
                result.excluded.push(value.replace(/^-/, ''));
            }
            else {
                result.text.push(value);
            }
        }
    }
    return result;
}
function parseDate(value) {
    // Try parsing various date formats
    // YYYY-MM-DD
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }
    // MM/DD/YYYY
    const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
        return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
    }
    // Natural language
    const now = new Date();
    if (value === 'today')
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (value === 'yesterday') {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        return d;
    }
    return null;
}
function parseRelativeTime(value) {
    const match = value.match(/^(\d+)([hdwmy])$/);
    if (!match)
        return null;
    const amount = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();
    switch (unit) {
        case 'h': // hours
            now.setHours(now.getHours() - amount);
            break;
        case 'd': // days
            now.setDate(now.getDate() - amount);
            break;
        case 'w': // weeks
            now.setDate(now.getDate() - amount * 7);
            break;
        case 'm': // months
            now.setMonth(now.getMonth() - amount);
            break;
        case 'y': // years
            now.setFullYear(now.getFullYear() - amount);
            break;
    }
    return now;
}
function buildSearchWhere(userId, parsed) {
    const conditions = [{ userId }];
    // Text search (subject, body, sender)
    if (parsed.text.length > 0) {
        const textConditions = parsed.text.map(term => ({
            OR: [
                { subject: { contains: term, mode: 'insensitive' } },
                { textBody: { contains: term, mode: 'insensitive' } },
                { fromName: { contains: term, mode: 'insensitive' } },
                { fromAddress: { contains: term, mode: 'insensitive' } },
            ]
        }));
        conditions.push(...textConditions);
    }
    // Excluded terms
    if (parsed.excluded.length > 0) {
        parsed.excluded.forEach(term => {
            conditions.push({
                NOT: {
                    OR: [
                        { subject: { contains: term, mode: 'insensitive' } },
                        { textBody: { contains: term, mode: 'insensitive' } },
                    ]
                }
            });
        });
    }
    // From
    if (parsed.from.length > 0) {
        conditions.push({
            OR: parsed.from.map(addr => ({
                OR: [
                    { fromAddress: { contains: addr, mode: 'insensitive' } },
                    { fromName: { contains: addr, mode: 'insensitive' } },
                ]
            }))
        });
    }
    // To
    if (parsed.to.length > 0) {
        conditions.push({
            OR: parsed.to.map(addr => ({
                toAddresses: { has: addr }
            }))
        });
    }
    // Subject
    if (parsed.subject.length > 0) {
        conditions.push({
            AND: parsed.subject.map(s => ({
                subject: { contains: s, mode: 'insensitive' }
            }))
        });
    }
    // Has attachment
    if (parsed.hasAttachment) {
        conditions.push({ hasAttachments: true });
    }
    // Attachment type
    if (parsed.attachmentType.length > 0) {
        conditions.push({
            attachments: {
                some: {
                    OR: parsed.attachmentType.map(type => {
                        // Map common names to mime types
                        const mimeMap = {
                            'pdf': ['application/pdf'],
                            'doc': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                            'xls': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                            'video': ['video/mp4', 'video/webm', 'video/avi'],
                            'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg'],
                            'zip': ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
                        };
                        const mimes = mimeMap[type.toLowerCase()];
                        if (mimes) {
                            return { mimeType: { in: mimes } };
                        }
                        return {
                            OR: [
                                { filename: { endsWith: `.${type}`, mode: 'insensitive' } },
                                { mimeType: { contains: type, mode: 'insensitive' } }
                            ]
                        };
                    })
                }
            }
        });
    }
    // Starred
    if (parsed.isStarred !== null) {
        conditions.push({ isStarred: parsed.isStarred });
    }
    // Read status
    if (parsed.isRead !== null) {
        conditions.push({ isRead: parsed.isRead });
    }
    // Labels
    if (parsed.labels.length > 0) {
        conditions.push({
            labels: { hasSome: parsed.labels }
        });
    }
    // Folder
    if (parsed.folder) {
        const validFolders = ['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE'];
        if (validFolders.includes(parsed.folder)) {
            conditions.push({ folder: parsed.folder });
        }
    }
    // Date filters
    if (parsed.before) {
        conditions.push({ sentAt: { lt: parsed.before } });
    }
    if (parsed.after) {
        conditions.push({ sentAt: { gt: parsed.after } });
    }
    // Relative time filters
    if (parsed.olderThan) {
        const date = parseRelativeTime(parsed.olderThan);
        if (date) {
            conditions.push({ sentAt: { lt: date } });
        }
    }
    if (parsed.newerThan) {
        const date = parseRelativeTime(parsed.newerThan);
        if (date) {
            conditions.push({ sentAt: { gt: date } });
        }
    }
    return { AND: conditions };
}
async function mailRoutes(fastify) {
    // ==========================================
    // MAIL ACCOUNT SETUP
    // ==========================================
    // Setup/configure mail account
    fastify.post('/account/setup', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, email: userEmail } = request.user;
        const { password } = request.body;
        if (!password) {
            return reply.status(400).send({ error: 'Email password is required' });
        }
        const result = await mailSyncService_1.mailSyncService.saveMailCredentials(userId, userEmail, password);
        if (result.success) {
            // Do initial sync
            const syncResult = await mailSyncService_1.mailSyncService.syncAllFolders(userId, userEmail, password);
            return {
                ...result,
                synced: syncResult.totalSynced,
                folders: syncResult.folders
            };
        }
        return reply.status(400).send(result);
    });
    // Test mail connection
    fastify.post('/account/test', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { email: userEmail } = request.user;
        const { password } = request.body;
        if (!password) {
            return reply.status(400).send({ error: 'Password required' });
        }
        const result = await mailSyncService_1.mailSyncService.testConnection(userEmail, password);
        return result;
    });
    // Check if mail is configured
    fastify.get('/account/status', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, email: userEmail } = request.user;
        const creds = await mailSyncService_1.mailSyncService.getMailCredentials(userId);
        const smtpStatus = emailService_1.emailService.getStatus();
        return {
            configured: !!creds,
            email: userEmail,
            smtpConfigured: smtpStatus.configured,
            server: process.env.SMTP_HOST || 'mail.exoinafrica.com',
        };
    });
    // ==========================================
    // SYNC ENDPOINTS  
    // ==========================================
    // Quick sync (just inbox)
    fastify.post('/sync/quick', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const result = await mailSyncService_1.mailSyncService.quickSync(userId);
        if (result.error) {
            return reply.status(400).send({ error: result.error });
        }
        return { success: true, synced: result.synced };
    });
    // Full sync (all folders)
    fastify.post('/sync/full', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, email: userEmail } = request.user;
        const { password } = request.body;
        // Get stored credentials or use provided password
        let creds = await mailSyncService_1.mailSyncService.getMailCredentials(userId);
        if (!creds && !password) {
            return reply.status(400).send({
                error: 'Mail not configured. Please provide password to setup.'
            });
        }
        const emailToUse = creds?.email || userEmail;
        const passToUse = creds?.password || password;
        // If password provided, save it
        if (password && !creds) {
            await mailSyncService_1.mailSyncService.saveMailCredentials(userId, userEmail, password);
        }
        const result = await mailSyncService_1.mailSyncService.syncAllFolders(userId, emailToUse, passToUse);
        return {
            success: true,
            synced: result.totalSynced,
            folders: result.folders,
        };
    });
    // Check for new mail
    fastify.get('/sync/check', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const result = await mailSyncService_1.mailSyncService.checkNewMail(userId);
        return result;
    });
    // ==========================================
    // FOLDER ENDPOINTS
    // ==========================================
    // Get folder counts
    fastify.get('/folders', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const folderCounts = await Promise.all([
            index_1.prisma.email.count({ where: { userId, folder: 'INBOX' } }),
            index_1.prisma.email.count({ where: { userId, folder: 'SENT' } }),
            index_1.prisma.email.count({ where: { userId, folder: 'DRAFTS' } }),
            index_1.prisma.email.count({ where: { userId, folder: 'TRASH' } }),
            index_1.prisma.email.count({ where: { userId, folder: 'SPAM' } }),
            index_1.prisma.email.count({ where: { userId, folder: 'ARCHIVE' } }),
            index_1.prisma.email.count({ where: { userId, folder: 'INBOX', isRead: false } }),
            index_1.prisma.email.count({ where: { userId, folder: 'SPAM', isRead: false } }),
        ]);
        const folders = [
            { name: 'Inbox', path: 'INBOX', icon: 'inbox', messages: folderCounts[0], unseen: folderCounts[6] },
            { name: 'Sent', path: 'SENT', icon: 'send', messages: folderCounts[1], unseen: 0 },
            { name: 'Drafts', path: 'DRAFTS', icon: 'file', messages: folderCounts[2], unseen: 0 },
            { name: 'Archive', path: 'ARCHIVE', icon: 'archive', messages: folderCounts[5], unseen: 0 },
            { name: 'Spam', path: 'SPAM', icon: 'alert', messages: folderCounts[4], unseen: folderCounts[7] },
            { name: 'Trash', path: 'TRASH', icon: 'trash', messages: folderCounts[3], unseen: 0 },
        ];
        return { folders };
    });
    // ==========================================
    // MESSAGE ENDPOINTS
    // ==========================================
    // Get emails from a folder
    fastify.get('/messages', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { folder = 'INBOX', page = '1', limit = '25', search } = request.query;
        const { id: userId } = request.user;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {
            userId,
            folder: folder
        };
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { fromName: { contains: search, mode: 'insensitive' } },
                { fromAddress: { contains: search, mode: 'insensitive' } },
                { snippet: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [emails, total] = await Promise.all([
            index_1.prisma.email.findMany({
                where,
                orderBy: { sentAt: 'desc' },
                skip,
                take: limitNum,
                include: {
                    attachments: {
                        select: { id: true, filename: true, mimeType: true, size: true }
                    }
                }
            }),
            index_1.prisma.email.count({ where })
        ]);
        const messages = emails.map(email => ({
            id: email.id,
            messageId: email.messageId,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            to: email.toAddresses.map(addr => ({ address: addr })),
            date: email.sentAt.toISOString(),
            snippet: email.snippet || '',
            isRead: email.isRead,
            isStarred: email.isStarred,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
            labels: email.labels,
            priority: email.priority,
        }));
        return {
            messages,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        };
    });
    // Get email history with a specific contact
    fastify.get('/history/:email', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { email: contactEmail } = request.params;
        const { id: userId } = request.user;
        const { page = '1', limit = '20' } = request.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Find emails where this contact is involved (from, to, cc)
        const [emails, total] = await Promise.all([
            index_1.prisma.email.findMany({
                where: {
                    userId,
                    OR: [
                        { fromAddress: { equals: contactEmail, mode: 'insensitive' } },
                        { toAddresses: { has: contactEmail } },
                        { ccAddresses: { has: contactEmail } },
                    ],
                },
                orderBy: { sentAt: 'desc' },
                skip,
                take: limitNum,
                select: {
                    id: true,
                    messageId: true,
                    subject: true,
                    fromName: true,
                    fromAddress: true,
                    toAddresses: true,
                    snippet: true,
                    sentAt: true,
                    isRead: true,
                    folder: true,
                    hasAttachments: true,
                }
            }),
            index_1.prisma.email.count({
                where: {
                    userId,
                    OR: [
                        { fromAddress: { equals: contactEmail, mode: 'insensitive' } },
                        { toAddresses: { has: contactEmail } },
                        { ccAddresses: { has: contactEmail } },
                    ],
                },
            })
        ]);
        return {
            contact: contactEmail,
            emails: emails.map(e => ({
                id: e.id,
                subject: e.subject,
                from: { name: e.fromName, address: e.fromAddress },
                to: e.toAddresses.map((addr) => ({ address: addr })),
                date: e.sentAt.toISOString(),
                snippet: e.snippet,
                isRead: e.isRead,
                folder: e.folder,
                direction: e.fromAddress?.toLowerCase() === contactEmail.toLowerCase() ? 'received' : 'sent',
                hasAttachments: e.hasAttachments,
            })),
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        };
    });
    // Get single email
    fastify.get('/messages/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { id: userId } = request.user;
        const email = await index_1.prisma.email.findFirst({
            where: { id, userId },
            include: { attachments: true }
        });
        if (!email) {
            return reply.status(404).send({ error: 'Email not found' });
        }
        // Mark as read (locally and on server)
        if (!email.isRead) {
            await index_1.prisma.email.update({
                where: { id },
                data: { isRead: true }
            });
            // Also mark on server (async, don't wait)
            mailSyncService_1.mailSyncService.markAsRead(userId, email.messageId, true).catch(console.error);
        }
        return {
            id: email.id,
            messageId: email.messageId,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            to: email.toAddresses.map(addr => ({ address: addr })),
            cc: email.ccAddresses.map(addr => ({ address: addr })),
            bcc: email.bccAddresses.map(addr => ({ address: addr })),
            date: email.sentAt.toISOString(),
            html: email.htmlBody,
            text: email.textBody,
            isRead: true,
            isStarred: email.isStarred,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
            folder: email.folder,
            labels: email.labels,
            priority: email.priority,
        };
    });
    // Get email thread/conversation by subject similarity
    fastify.get('/thread/:subjectQuery', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { subjectQuery } = request.params;
        const { id: userId } = request.user;
        // Clean subject for matching (remove Re:, Fwd:, etc.)
        const cleanSubject = decodeURIComponent(subjectQuery)
            .replace(/^(Re:|Fwd:|RE:|FWD:|Fw:)\s*/gi, '')
            .trim();
        // Find all emails with matching subject
        const emails = await index_1.prisma.email.findMany({
            where: {
                userId,
                OR: [
                    { subject: { contains: cleanSubject, mode: 'insensitive' } },
                    { subject: { equals: `Re: ${cleanSubject}`, mode: 'insensitive' } },
                    { subject: { equals: `Fwd: ${cleanSubject}`, mode: 'insensitive' } },
                ]
            },
            orderBy: { sentAt: 'asc' },
            include: {
                attachments: {
                    select: { id: true, filename: true, mimeType: true, size: true }
                }
            }
        });
        const messages = emails.map(email => ({
            id: email.id,
            messageId: email.messageId,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            to: email.toAddresses.map(addr => ({ address: addr })),
            cc: email.ccAddresses.map(addr => ({ address: addr })),
            date: email.sentAt.toISOString(),
            html: email.htmlBody,
            text: email.textBody,
            snippet: email.snippet,
            isRead: email.isRead,
            isStarred: email.isStarred,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
            folder: email.folder,
            labels: email.labels,
            priority: email.priority,
        }));
        return { messages, threadCount: messages.length };
    });
    // Get/download attachment
    fastify.get('/attachments/:attachmentId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { attachmentId } = request.params;
        const { id: userId } = request.user;
        // Find the attachment with its email to verify ownership
        const attachment = await index_1.prisma.emailAttachment.findFirst({
            where: { id: attachmentId },
            include: { email: { select: { userId: true, messageId: true } } }
        });
        if (!attachment) {
            return reply.status(404).send({ error: 'Attachment not found' });
        }
        if (attachment.email.userId !== userId) {
            return reply.status(403).send({ error: 'Access denied' });
        }
        // If we have a URL stored (e.g., from MinIO/S3), redirect to it
        if (attachment.url) {
            return reply.redirect(attachment.url);
        }
        // Try to fetch from mail server using IMAP
        try {
            const content = await mailSyncService_1.mailSyncService.fetchAttachment(userId, attachment.email.messageId, attachment.id);
            if (content) {
                reply.header('Content-Type', attachment.mimeType || 'application/octet-stream');
                reply.header('Content-Disposition', `attachment; filename="${attachment.filename}"`);
                reply.header('Content-Length', content.length);
                return reply.send(content);
            }
        }
        catch (err) {
            console.error('Failed to fetch attachment from server:', err);
        }
        return reply.status(404).send({ error: 'Attachment content not available' });
    });
    // ==========================================
    // SEND EMAIL
    // ==========================================
    fastify.post('/send', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, email: userEmail } = request.user;
        const { to, cc, bcc, subject, html, text, includeSignature, priority = 'normal', replyTo, forwardOf, attachDocumentId, attachments: reqAttachments } = request.body;
        if (!to || !to.length) {
            return reply.status(400).send({ error: 'Recipient (to) is required' });
        }
        if (!subject) {
            return reply.status(400).send({ error: 'Subject is required' });
        }
        // Get sender info
        const sender = await index_1.prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });
        if (!sender) {
            return reply.status(404).send({ error: 'User not found' });
        }
        // Build attachments array
        const attachments = [];
        // Process attachments from request body
        if (reqAttachments && Array.isArray(reqAttachments)) {
            for (const att of reqAttachments) {
                if (att.filename && att.content && att.encoding === 'base64') {
                    attachments.push({
                        filename: att.filename,
                        content: Buffer.from(att.content, 'base64'),
                        contentType: att.contentType || 'application/octet-stream'
                    });
                }
            }
        }
        // If there's a document attachment, fetch the PDF
        if (attachDocumentId) {
            try {
                const document = await index_1.prisma.document.findUnique({
                    where: { id: attachDocumentId },
                    select: { pdfUrl: true, documentNumber: true, type: true }
                });
                if (document?.pdfUrl) {
                    // Fetch PDF from MinIO
                    const objectName = document.pdfUrl.replace(`/${BUCKET_NAME}/`, '');
                    const stream = await minioClient.getObject(BUCKET_NAME, objectName);
                    const chunks = [];
                    for await (const chunk of stream) {
                        chunks.push(chunk);
                    }
                    const pdfBuffer = Buffer.concat(chunks);
                    attachments.push({
                        filename: `${document.documentNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    });
                }
            }
            catch (err) {
                console.error('Failed to attach document:', err);
                // Continue without attachment
            }
        }
        // Build final HTML
        let finalHtml = html || `<div style="font-family: Arial, sans-serif;">${(text || '').replace(/\n/g, '<br>')}</div>`;
        if (includeSignature && sender.signatureEnabled) {
            finalHtml += await generateSignature(sender, sender.company);
        }
        const messageId = `<${(0, uuid_1.v4)()}@exoinafrica.com>`;
        const toAddresses = Array.isArray(to) ? to : [to];
        const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
        const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];
        // Send via SMTP
        const smtpResult = await emailService_1.emailService.sendEmail({
            to: toAddresses,
            cc: ccAddresses.length > 0 ? ccAddresses : undefined,
            bcc: bccAddresses.length > 0 ? bccAddresses : undefined,
            subject,
            html: finalHtml,
            text: text || '',
            priority: priority,
            replyTo: replyTo || userEmail,
            attachments: attachments.length > 0 ? attachments : undefined,
        });
        if (smtpResult.success) {
            // Save to Sent folder
            const sentEmail = await index_1.prisma.email.create({
                data: {
                    messageId: smtpResult.messageId || messageId,
                    folder: 'SENT',
                    fromName: `${sender.firstName} ${sender.lastName}`,
                    fromAddress: userEmail,
                    toAddresses,
                    ccAddresses,
                    bccAddresses,
                    subject,
                    htmlBody: finalHtml,
                    textBody: text,
                    snippet: (text || subject).substring(0, 150),
                    isRead: true,
                    userId,
                    priority,
                    hasAttachments: attachments.length > 0,
                }
            });
            return {
                success: true,
                message: 'Email sent successfully',
                messageId: smtpResult.messageId || messageId,
                id: sentEmail.id,
            };
        }
        else {
            // Failed to send - save to Outbox with FAILED status
            try {
                const outboxEmail = await index_1.prisma.emailOutbox.create({
                    data: {
                        fromName: `${sender.firstName} ${sender.lastName}`,
                        fromAddress: userEmail,
                        toAddresses,
                        ccAddresses,
                        bccAddresses,
                        subject,
                        htmlBody: finalHtml,
                        textBody: text,
                        sendAt: new Date(),
                        status: 'FAILED',
                        errorMessage: smtpResult.error || 'Failed to send email',
                        userId,
                    }
                });
                return {
                    success: false,
                    message: 'Failed to send email. Saved to Outbox.',
                    error: smtpResult.error,
                    outboxId: outboxEmail.id,
                };
            }
            catch (outboxError) {
                console.error('Failed to save to outbox:', outboxError);
                // If saving to outbox also fails, return the original error
                return {
                    success: false,
                    message: 'Failed to send email and failed to save to Outbox.',
                    error: smtpResult.error || 'Unknown error',
                };
            }
        }
    });
    // ==========================================
    // SEND WITH UNDO (Queued Send)
    // ==========================================
    // Queue email for sending (with undo delay)
    fastify.post('/send/queue', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId, email: userEmail } = request.user;
        const { to, cc, bcc, subject, html, text, includeSignature, priority = 'normal', undoDelaySeconds = 10, // Default 10 seconds
        scheduledAt, // For scheduled sending
         } = request.body;
        if (!to || !to.length) {
            return reply.status(400).send({ error: 'Recipient (to) is required' });
        }
        if (!subject) {
            return reply.status(400).send({ error: 'Subject is required' });
        }
        // Get sender info
        const sender = await index_1.prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });
        if (!sender) {
            return reply.status(404).send({ error: 'User not found' });
        }
        // Build final HTML
        let finalHtml = html || `<div style="font-family: Arial, sans-serif;">${(text || '').replace(/\n/g, '<br>')}</div>`;
        if (includeSignature && sender.signatureEnabled) {
            finalHtml += await generateSignature(sender, sender.company);
        }
        const toAddresses = Array.isArray(to) ? to : [to];
        const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
        const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];
        // Queue the email
        const result = await outboxService_1.outboxService.queueEmail({
            userId,
            fromName: `${sender.firstName} ${sender.lastName}`,
            fromAddress: userEmail,
            to: toAddresses,
            cc: ccAddresses,
            bcc: bccAddresses,
            subject,
            html: finalHtml,
            text: text || '',
            undoDelaySeconds,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });
        return {
            success: true,
            message: scheduledAt ? 'Email scheduled' : 'Email queued for sending',
            outboxId: result.id,
            sendAt: result.sendAt.toISOString(),
            canUndo: result.canUndo,
            undoDelaySeconds: result.canUndo ? undoDelaySeconds : 0,
        };
    });
    // Cancel/undo a queued email
    fastify.post('/send/undo/:outboxId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { outboxId } = request.params;
        const { id: userId } = request.user;
        const result = await outboxService_1.outboxService.cancelEmail(outboxId, userId);
        if (!result.success) {
            return reply.status(400).send({ error: result.message });
        }
        return { success: true, message: result.message };
    });
    // Get pending/scheduled emails
    fastify.get('/outbox', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const pending = await outboxService_1.outboxService.getPendingEmails(userId);
        return {
            emails: pending.map(email => ({
                id: email.id,
                to: email.toAddresses,
                cc: email.ccAddresses,
                subject: email.subject,
                sendAt: email.sendAt.toISOString(),
                status: email.status,
                timeRemaining: outboxService_1.outboxService.getTimeRemaining(email.sendAt),
                createdAt: email.createdAt.toISOString(),
            })),
        };
    });
    // Get scheduled emails (future sends)
    fastify.get('/scheduled', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const scheduled = await outboxService_1.outboxService.getScheduledEmails(userId);
        return {
            emails: scheduled.map(email => ({
                id: email.id,
                to: email.toAddresses,
                cc: email.ccAddresses,
                subject: email.subject,
                snippet: (email.textBody || email.subject).substring(0, 100),
                sendAt: email.sendAt.toISOString(),
                status: email.status,
                createdAt: email.createdAt.toISOString(),
            })),
        };
    });
    // Update a scheduled email
    fastify.put('/scheduled/:outboxId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { outboxId } = request.params;
        const { id: userId } = request.user;
        const { to, cc, bcc, subject, html, text, scheduledAt } = request.body;
        const result = await outboxService_1.outboxService.updateScheduledEmail(outboxId, userId, {
            to, cc, bcc, subject, html, text,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        });
        if (!result.success) {
            return reply.status(400).send({ error: result.message });
        }
        return { success: true, message: result.message };
    });
    // Cancel a scheduled email
    fastify.delete('/scheduled/:outboxId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { outboxId } = request.params;
        const { id: userId } = request.user;
        const result = await outboxService_1.outboxService.cancelEmail(outboxId, userId);
        if (!result.success) {
            return reply.status(400).send({ error: result.message });
        }
        return { success: true, message: result.message };
    });
    // ==========================================
    // EMAIL ACTIONS
    // ==========================================
    // Mark as read/unread
    fastify.put('/messages/:id/read', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { isRead } = request.body;
        const { id: userId } = request.user;
        const email = await index_1.prisma.email.findFirst({ where: { id, userId } });
        if (!email) {
            return reply.status(404).send({ error: 'Email not found' });
        }
        await index_1.prisma.email.update({
            where: { id },
            data: { isRead }
        });
        // Sync to server
        mailSyncService_1.mailSyncService.markAsRead(userId, email.messageId, isRead).catch(console.error);
        return { success: true, id, isRead };
    });
    // Star/unstar
    fastify.put('/messages/:id/star', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { isStarred } = request.body;
        const { id: userId } = request.user;
        await index_1.prisma.email.updateMany({
            where: { id, userId },
            data: { isStarred }
        });
        return { success: true, id, isStarred };
    });
    // Move email
    fastify.put('/messages/:id/move', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { folder } = request.body;
        const { id: userId } = request.user;
        if (!['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE'].includes(folder)) {
            return reply.status(400).send({ error: 'Invalid folder' });
        }
        const email = await index_1.prisma.email.findFirst({ where: { id, userId } });
        if (!email) {
            return reply.status(404).send({ error: 'Email not found' });
        }
        await index_1.prisma.email.update({
            where: { id },
            data: { folder: folder }
        });
        // Sync to server
        mailSyncService_1.mailSyncService.moveEmail(userId, email.messageId, folder).catch(console.error);
        return { success: true, id, folder };
    });
    // Delete email
    fastify.delete('/messages/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { id: userId } = request.user;
        const email = await index_1.prisma.email.findFirst({ where: { id, userId } });
        if (!email) {
            return reply.status(404).send({ error: 'Email not found' });
        }
        if (email.folder === 'TRASH') {
            // Permanently delete
            await index_1.prisma.email.delete({ where: { id } });
            return { success: true, message: 'Email permanently deleted' };
        }
        else {
            // Move to trash
            await index_1.prisma.email.update({
                where: { id },
                data: { folder: 'TRASH' }
            });
            mailSyncService_1.mailSyncService.deleteEmail(userId, email.messageId).catch(console.error);
            return { success: true, message: 'Email moved to trash' };
        }
    });
    // Bulk actions
    fastify.post('/messages/bulk', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { ids, action, folder } = request.body;
        const { id: userId } = request.user;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return reply.status(400).send({ error: 'Email IDs required' });
        }
        switch (action) {
            case 'read':
                await index_1.prisma.email.updateMany({
                    where: { id: { in: ids }, userId },
                    data: { isRead: true }
                });
                break;
            case 'unread':
                await index_1.prisma.email.updateMany({
                    where: { id: { in: ids }, userId },
                    data: { isRead: false }
                });
                break;
            case 'star':
                await index_1.prisma.email.updateMany({
                    where: { id: { in: ids }, userId },
                    data: { isStarred: true }
                });
                break;
            case 'unstar':
                await index_1.prisma.email.updateMany({
                    where: { id: { in: ids }, userId },
                    data: { isStarred: false }
                });
                break;
            case 'move':
                if (!folder) {
                    return reply.status(400).send({ error: 'Folder required for move' });
                }
                await index_1.prisma.email.updateMany({
                    where: { id: { in: ids }, userId },
                    data: { folder: folder }
                });
                break;
            case 'delete':
                await index_1.prisma.email.updateMany({
                    where: { id: { in: ids }, userId, folder: { not: 'TRASH' } },
                    data: { folder: 'TRASH' }
                });
                await index_1.prisma.email.deleteMany({
                    where: { id: { in: ids }, userId, folder: 'TRASH' }
                });
                break;
            default:
                return reply.status(400).send({ error: 'Invalid action' });
        }
        return { success: true, action, count: ids.length };
    });
    // Search emails (basic)
    fastify.get('/search', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { q, folder } = request.query;
        const { id: userId } = request.user;
        if (!q) {
            return reply.status(400).send({ error: 'Search query required' });
        }
        const where = {
            userId,
            OR: [
                { subject: { contains: q, mode: 'insensitive' } },
                { fromName: { contains: q, mode: 'insensitive' } },
                { fromAddress: { contains: q, mode: 'insensitive' } },
                { textBody: { contains: q, mode: 'insensitive' } },
            ]
        };
        if (folder && folder !== 'ALL') {
            where.folder = folder;
        }
        const emails = await index_1.prisma.email.findMany({
            where,
            orderBy: { sentAt: 'desc' },
            take: 50,
        });
        const results = emails.map(email => ({
            id: email.id,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            date: email.sentAt.toISOString(),
            snippet: email.snippet,
            isRead: email.isRead,
            folder: email.folder,
        }));
        return { results, query: q, total: results.length };
    });
    // Full-Text Search using PostgreSQL tsvector
    fastify.get('/search/fulltext', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { q, folder, page = '1', limit = '50' } = request.query;
        const { id: userId } = request.user;
        if (!q) {
            return reply.status(400).send({ error: 'Search query required' });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        // Convert search query to tsquery format
        // Split query into words and join with &
        const tsQuery = q
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0)
            .map((word) => `${word}:*`) // Add prefix matching
            .join(' & ');
        const folderCondition = folder && folder !== 'ALL'
            ? `AND "folder" = '${folder}'`
            : '';
        // Use raw query for full-text search with ranking
        const emails = await index_1.prisma.$queryRawUnsafe(`
      SELECT 
        id, "messageId", subject, "fromName", "fromAddress", 
        "toAddresses", snippet, "sentAt", "isRead", "isStarred",
        folder, labels, "hasAttachments", priority,
        ts_rank("searchVector", to_tsquery('english', $1)) as rank,
        ts_headline('english', COALESCE(subject, '') || ' ' || COALESCE("textBody", ''), 
                    to_tsquery('english', $1), 
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25') as highlight
      FROM "Email"
      WHERE "userId" = $2
        AND "searchVector" @@ to_tsquery('english', $1)
        ${folderCondition}
      ORDER BY rank DESC, "sentAt" DESC
      LIMIT $3 OFFSET $4
    `, tsQuery, userId, limitNum, offset);
        // Get total count
        const countResult = await index_1.prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM "Email"
      WHERE "userId" = $1
        AND "searchVector" @@ to_tsquery('english', $2)
        ${folderCondition}
    `, userId, tsQuery);
        const total = parseInt(countResult[0]?.count || '0');
        const results = emails.map(email => ({
            id: email.id,
            messageId: email.messageId,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            to: email.toAddresses?.map((addr) => ({ address: addr })) || [],
            date: email.sentAt?.toISOString(),
            snippet: email.snippet,
            highlight: email.highlight,
            rank: parseFloat(email.rank || '0'),
            isRead: email.isRead,
            isStarred: email.isStarred,
            folder: email.folder,
            labels: email.labels || [],
            hasAttachments: email.hasAttachments,
            priority: email.priority,
        }));
        return {
            results,
            query: q,
            tsQuery,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            }
        };
    });
    // Advanced search with operators
    fastify.get('/search/advanced', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { q, page = '1', limit = '50' } = request.query;
        const { id: userId } = request.user;
        if (!q) {
            return reply.status(400).send({ error: 'Search query required' });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Parse the search query for operators
        const parsed = parseSearchQuery(q);
        const where = buildSearchWhere(userId, parsed);
        const [emails, total] = await Promise.all([
            index_1.prisma.email.findMany({
                where,
                orderBy: { sentAt: 'desc' },
                skip,
                take: limitNum,
                include: {
                    attachments: {
                        select: { id: true, filename: true, mimeType: true, size: true }
                    }
                }
            }),
            index_1.prisma.email.count({ where })
        ]);
        const results = emails.map(email => ({
            id: email.id,
            messageId: email.messageId,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            to: email.toAddresses.map(addr => ({ address: addr })),
            date: email.sentAt.toISOString(),
            snippet: email.snippet,
            isRead: email.isRead,
            isStarred: email.isStarred,
            folder: email.folder,
            labels: email.labels,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments,
        }));
        return {
            results,
            query: q,
            parsed,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            }
        };
    });
    // Search suggestions / autocomplete
    fastify.get('/search/suggestions', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { q } = request.query;
        const { id: userId } = request.user;
        if (!q || q.length < 2) {
            return { suggestions: [] };
        }
        // Get unique senders matching the query
        const senderSuggestions = await index_1.prisma.email.findMany({
            where: {
                userId,
                OR: [
                    { fromAddress: { contains: q, mode: 'insensitive' } },
                    { fromName: { contains: q, mode: 'insensitive' } },
                ]
            },
            select: { fromAddress: true, fromName: true },
            distinct: ['fromAddress'],
            take: 5,
        });
        // Get subject matches
        const subjectSuggestions = await index_1.prisma.email.findMany({
            where: {
                userId,
                subject: { contains: q, mode: 'insensitive' }
            },
            select: { subject: true },
            distinct: ['subject'],
            take: 5,
        });
        // Get label matches
        const labelSuggestions = await index_1.prisma.email.findMany({
            where: {
                userId,
                labels: { hasSome: [q] }
            },
            select: { labels: true },
            take: 10,
        });
        const uniqueLabels = [...new Set(labelSuggestions.flatMap(e => e.labels).filter(l => l.toLowerCase().includes(q.toLowerCase())))].slice(0, 3);
        return {
            suggestions: [
                ...senderSuggestions.map(s => ({
                    type: 'from',
                    value: s.fromAddress,
                    display: s.fromName ? `${s.fromName} <${s.fromAddress}>` : s.fromAddress,
                    query: `from:${s.fromAddress}`,
                })),
                ...subjectSuggestions.map(s => ({
                    type: 'subject',
                    value: s.subject,
                    display: s.subject,
                    query: `subject:"${s.subject}"`,
                })),
                ...uniqueLabels.map(l => ({
                    type: 'label',
                    value: l,
                    display: l,
                    query: `label:${l}`,
                })),
            ]
        };
    });
    // Labels
    fastify.put('/messages/:id/labels', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { label, action } = request.body;
        const { id: userId } = request.user;
        const email = await index_1.prisma.email.findFirst({ where: { id, userId } });
        if (!email) {
            return reply.status(404).send({ error: 'Email not found' });
        }
        let newLabels = [...email.labels];
        if (action === 'add' && !newLabels.includes(label)) {
            newLabels.push(label);
        }
        else if (action === 'remove') {
            newLabels = newLabels.filter(l => l !== label);
        }
        await index_1.prisma.email.update({
            where: { id },
            data: { labels: newLabels }
        });
        return { success: true, id, labels: newLabels };
    });
    // ==========================================
    // SNOOZE ENDPOINTS
    // ==========================================
    // Snooze an email
    fastify.post('/messages/:id/snooze', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { preset, customTime } = request.body;
        const { id: userId } = request.user;
        const result = await snoozeService_1.snoozeService.snoozeEmail({
            emailId: id,
            userId,
            preset: preset,
            customTime: customTime ? new Date(customTime) : undefined,
        });
        if (!result.success) {
            return reply.status(400).send({ error: result.message });
        }
        return {
            success: true,
            message: result.message,
            snoozedUntil: result.snoozedUntil.toISOString(),
            timeRemaining: snoozeService_1.snoozeService.getTimeRemaining(result.snoozedUntil),
        };
    });
    // Unsnooze an email (cancel snooze)
    fastify.delete('/messages/:id/snooze', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { id: userId } = request.user;
        const result = await snoozeService_1.snoozeService.unsnoozeEmail(id, userId);
        if (!result.success) {
            return reply.status(400).send({ error: result.message });
        }
        return { success: true, message: result.message };
    });
    // Update snooze time
    fastify.put('/messages/:id/snooze', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { newTime } = request.body;
        const { id: userId } = request.user;
        if (!newTime) {
            return reply.status(400).send({ error: 'New time required' });
        }
        const result = await snoozeService_1.snoozeService.updateSnoozeTime(id, userId, new Date(newTime));
        if (!result.success) {
            return reply.status(400).send({ error: result.message });
        }
        return { success: true, message: result.message };
    });
    // Get all snoozed emails
    fastify.get('/snoozed', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const emails = await snoozeService_1.snoozeService.getSnoozedEmails(userId);
        return {
            emails: emails.map(email => ({
                id: email.id,
                messageId: email.messageId,
                subject: email.subject,
                from: { name: email.fromName, address: email.fromAddress },
                date: email.sentAt.toISOString(),
                snippet: email.snippet,
                snoozedUntil: email.snoozedUntil?.toISOString(),
                snoozedFromFolder: email.snoozedFromFolder,
                timeRemaining: email.snoozedUntil ? snoozeService_1.snoozeService.getTimeRemaining(email.snoozedUntil) : null,
                hasAttachments: email.hasAttachments,
                attachments: email.attachments,
            })),
        };
    });
    // Get snooze presets with calculated times
    fastify.get('/snooze/presets', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const now = new Date();
        // Calculate times for each preset
        const presets = [
            {
                id: 'LATER_TODAY',
                label: 'Later today',
                time: calculatePresetTime('LATER_TODAY', now),
            },
            {
                id: 'TOMORROW',
                label: 'Tomorrow',
                time: calculatePresetTime('TOMORROW', now),
            },
            {
                id: 'THIS_WEEKEND',
                label: 'This weekend',
                time: calculatePresetTime('THIS_WEEKEND', now),
            },
            {
                id: 'NEXT_WEEK',
                label: 'Next week',
                time: calculatePresetTime('NEXT_WEEK', now),
            },
        ];
        return { presets };
    });
    // ==========================================
    // PRIORITY INBOX ENDPOINTS
    // ==========================================
    // Get prioritized inbox (split into sections)
    fastify.get('/inbox/priority', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const { limit = '100' } = request.query;
        const result = await priorityService_1.priorityService.getPrioritizedInbox(userId, parseInt(limit));
        // Transform emails for response
        const transformEmail = (email) => ({
            id: email.id,
            messageId: email.messageId,
            subject: email.subject,
            from: { name: email.fromName, address: email.fromAddress },
            to: email.toAddresses.map((addr) => ({ address: addr })),
            date: email.sentAt.toISOString(),
            snippet: email.snippet || '',
            isRead: email.isRead,
            isStarred: email.isStarred,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments || [],
            labels: email.labels,
            priority: email.priority,
            priorityScore: result.priorityScores[email.id],
        });
        return {
            sections: {
                importantAndUnread: {
                    title: 'Important and unread',
                    emails: result.importantAndUnread.map(transformEmail),
                    count: result.importantAndUnread.length,
                },
                starred: {
                    title: 'Starred',
                    emails: result.starred.map(transformEmail),
                    count: result.starred.length,
                },
                everythingElse: {
                    title: 'Everything else',
                    emails: result.everythingElse.map(transformEmail),
                    count: result.everythingElse.length,
                },
            },
            total: result.importantAndUnread.length + result.starred.length + result.everythingElse.length,
        };
    });
    // Get priority inbox counts (for sidebar)
    fastify.get('/inbox/priority/counts', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const counts = await priorityService_1.priorityService.getSmartInboxCounts(userId);
        return { counts };
    });
    // Get priority insight for a specific email
    fastify.get('/messages/:id/priority', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { id: userId } = request.user;
        const insight = await priorityService_1.priorityService.getEmailPriorityInsight(id, userId);
        if (!insight) {
            return reply.status(404).send({ error: 'Email not found' });
        }
        return insight;
    });
    // SMTP status
    fastify.get('/smtp/status', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        return emailService_1.emailService.getStatus();
    });
    fastify.post('/smtp/verify', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        return await emailService_1.emailService.verifyConnection();
    });
    // ==========================================
    // VACATION RESPONDER ROUTES
    // ==========================================
    // Get vacation responder settings
    fastify.get('/vacation-responder', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const responder = await index_1.prisma.vacationResponder.findUnique({
            where: { userId }
        });
        if (!responder) {
            return { responder: null, isActive: false };
        }
        // Check if currently active
        const now = new Date();
        const isActive = responder.isActive &&
            now >= responder.startDate &&
            now <= responder.endDate;
        return {
            responder: {
                id: responder.id,
                startDate: responder.startDate,
                endDate: responder.endDate,
                subject: responder.subject,
                message: responder.message,
                isActive: responder.isActive,
                onlyContacts: responder.onlyContacts,
                onlyOnce: responder.onlyOnce,
                excludedDomains: responder.excludedDomains,
                respondedToCount: responder.respondedTo.length,
            },
            isActive
        };
    });
    // Create or update vacation responder
    fastify.post('/vacation-responder', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const { startDate, endDate, subject, message, isActive, onlyContacts, onlyOnce, excludedDomains } = request.body;
        // Check if one already exists
        const existing = await index_1.prisma.vacationResponder.findUnique({
            where: { userId }
        });
        let responder;
        if (existing) {
            // Update existing
            responder = await index_1.prisma.vacationResponder.update({
                where: { userId },
                data: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    subject: subject || 'Out of Office',
                    message,
                    isActive: isActive ?? true,
                    onlyContacts: onlyContacts ?? false,
                    onlyOnce: onlyOnce ?? true,
                    excludedDomains: excludedDomains || [],
                    // Reset respondedTo when reactivating
                    respondedTo: isActive ? [] : existing.respondedTo,
                }
            });
        }
        else {
            // Create new
            responder = await index_1.prisma.vacationResponder.create({
                data: {
                    userId,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    subject: subject || 'Out of Office',
                    message,
                    isActive: isActive ?? true,
                    onlyContacts: onlyContacts ?? false,
                    onlyOnce: onlyOnce ?? true,
                    excludedDomains: excludedDomains || [],
                    respondedTo: [],
                }
            });
        }
        return { responder };
    });
    // Toggle vacation responder active state
    fastify.patch('/vacation-responder/toggle', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        const { isActive } = request.body;
        const existing = await index_1.prisma.vacationResponder.findUnique({
            where: { userId }
        });
        if (!existing) {
            return reply.status(404).send({ error: 'No vacation responder found' });
        }
        const responder = await index_1.prisma.vacationResponder.update({
            where: { userId },
            data: {
                isActive,
                // Reset respondedTo when reactivating
                respondedTo: isActive ? [] : existing.respondedTo,
            }
        });
        return { responder, isActive };
    });
    // Delete vacation responder
    fastify.delete('/vacation-responder', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id: userId } = request.user;
        await index_1.prisma.vacationResponder.deleteMany({
            where: { userId }
        });
        return { success: true };
    });
}
// Helper: Generate signature HTML
async function generateSignature(user, company) {
    const style = user.signatureStyle || 'executive';
    const isDark = false; // Default to light mode for emails
    // Colors
    const primaryColor = company?.primaryColor || '#1E3A8A';
    const accentColor = company?.secondaryColor || '#F97316';
    // Text colors based on theme
    const textColor = isDark ? '#FFFFFF' : '#0F172A';
    const subTextColor = isDark ? '#94A3B8' : '#64748B';
    const lightTextColor = isDark ? '#64748B' : '#94A3B8';
    const borderColor = isDark ? '#334155' : '#E2E8F0';
    const iconBg = isDark ? '#334155' : '#F1F5F9';
    // Logo SVG (inline for email compatibility)
    const logoSVG = `
    <svg viewBox="0 0 100 100" width="24" height="24" style="vertical-align: middle;">
      <path d="M15 30 C15 21.7157 21.7157 15 30 15 H55 L55 45 L85 75 H60 C51.7157 75 45 68.2843 45 60 V60 L15 30 Z" fill="${isDark ? '#FFFFFF' : primaryColor}" />
      <path d="M85 70 C85 78.2843 78.2843 85 70 85 H45 L45 55 L15 25 H40 C48.2843 25 55 31.7157 55 40 V40 L85 70 Z" fill="${accentColor}" />
    </svg>
  `;
    // Social icons
    const linkedinIcon = user.linkedinUrl ? `
    <a href="${user.linkedinUrl}" style="text-decoration:none;margin-right:8px;">
      <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="16" height="16" alt="LinkedIn" style="vertical-align:middle;">
    </a>
  ` : '';
    const twitterIcon = user.twitterUrl ? `
    <a href="${user.twitterUrl}" style="text-decoration:none;margin-right:8px;">
      <img src="https://cdn-icons-png.flaticon.com/512/5968/5968830.png" width="16" height="16" alt="X" style="vertical-align:middle;">
    </a>
  ` : '';
    const instagramIcon = user.instagramUrl ? `
    <a href="${user.instagramUrl}" style="text-decoration:none;margin-right:8px;">
      <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="16" height="16" alt="Instagram" style="vertical-align:middle;">
    </a>
  ` : '';
    const socialLinks = linkedinIcon || twitterIcon || instagramIcon ? `
    <div style="margin-top:12px;">
      ${linkedinIcon}${twitterIcon}${instagramIcon}
    </div>
  ` : '';
    if (style === 'executive') {
        return `
<br><br>
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:2px solid ${accentColor};padding-top:16px;margin-top:24px;font-family:Arial,Helvetica,sans-serif;max-width:500px;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <!-- Avatar placeholder -->
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,${accentColor},${primaryColor});display:flex;align-items:center;justify-content:center;">
        <span style="color:#FFFFFF;font-size:24px;font-weight:bold;">${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}</span>
      </div>
    </td>
    <td style="vertical-align:top;padding-right:20px;">
      <!-- Name & Title -->
      <div style="font-size:18px;font-weight:bold;color:${textColor};line-height:1.2;">
        ${user.firstName} ${user.lastName}
      </div>
      <div style="font-size:11px;font-weight:bold;color:${accentColor};text-transform:uppercase;letter-spacing:1px;margin-top:4px;margin-bottom:12px;">
        ${user.jobTitle || 'Team Member'}
      </div>
      
      <!-- Contact Info -->
      <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:${subTextColor};">
        ${user.phone ? `
        <tr>
          <td style="padding:4px 12px 4px 0;">
            <span style="background:${iconBg};padding:4px;border-radius:4px;display:inline-block;">📞</span>
          </td>
          <td style="padding:4px 0;">
            <a href="tel:${user.phone}" style="color:${subTextColor};text-decoration:none;">${user.phone}</a>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:4px 12px 4px 0;">
            <span style="background:${iconBg};padding:4px;border-radius:4px;display:inline-block;">✉️</span>
          </td>
          <td style="padding:4px 0;">
            <a href="mailto:${user.email}" style="color:${subTextColor};text-decoration:none;">${user.email}</a>
          </td>
        </tr>
        ${user.location ? `
        <tr>
          <td style="padding:4px 12px 4px 0;">
            <span style="background:${iconBg};padding:4px;border-radius:4px;display:inline-block;">📍</span>
          </td>
          <td style="padding:4px 0;">${user.location}</td>
        </tr>
        ` : ''}
        ${company?.website ? `
        <tr>
          <td style="padding:4px 12px 4px 0;">
            <span style="background:${iconBg};padding:4px;border-radius:4px;display:inline-block;">🌐</span>
          </td>
          <td style="padding:4px 0;">
            <a href="${company.website}" style="color:${subTextColor};text-decoration:none;">${company.website.replace('https://', '')}</a>
          </td>
        </tr>
        ` : ''}
      </table>
      
      ${user.officeAddress ? `
      <div style="margin-top:8px;font-size:10px;color:${lightTextColor};">
        ${user.officeAddress}
      </div>
      ` : ''}
    </td>
    <td style="vertical-align:top;border-left:1px solid ${borderColor};padding-left:16px;">
      <!-- Logo & Social -->
      <div style="margin-bottom:12px;">
        ${logoSVG}
        <span style="font-size:14px;font-weight:900;color:${textColor};letter-spacing:-0.5px;vertical-align:middle;margin-left:6px;">EXOIN</span>
        <span style="font-size:8px;color:${lightTextColor};letter-spacing:2px;vertical-align:middle;margin-left:2px;">AFRICA</span>
      </div>
      ${socialLinks}
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding-top:16px;border-top:1px solid ${borderColor};margin-top:16px;">
      <div style="font-size:9px;color:${lightTextColor};line-height:1.5;">
        <strong style="color:${subTextColor};">Confidentiality Notice:</strong> This email is intended only for the person to whom it is addressed. If you are not the intended recipient, you are not authorized to read, print, retain, copy, disseminate, distribute, or use this message or any part thereof.
      </div>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
    `.trim();
    }
    // Compact style
    return `
<br><br>
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:2px solid ${accentColor};padding-top:12px;margin-top:20px;font-family:Arial,Helvetica,sans-serif;max-width:400px;">
  <tr>
    <td style="vertical-align:middle;padding-right:12px;">
      ${logoSVG}
    </td>
    <td style="vertical-align:middle;">
      <div style="font-size:14px;font-weight:bold;color:${textColor};">${user.firstName} ${user.lastName}</div>
      <div style="font-size:11px;color:${subTextColor};">${user.jobTitle || 'Team Member'} | ${company?.name || 'Exoin'}</div>
      <div style="font-size:11px;color:${lightTextColor};margin-top:4px;">
        ${user.phone ? `📞 ${user.phone} | ` : ''}✉️ ${user.email}
      </div>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
  `.trim();
}
