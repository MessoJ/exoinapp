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
exports.getEmailHostingSettings = getEmailHostingSettings;
exports.updateEmailHostingSettings = updateEmailHostingSettings;
exports.provisionMailboxForUser = provisionMailboxForUser;
exports.linkMailboxToUser = linkMailboxToUser;
exports.unlinkMailboxFromUser = unlinkMailboxFromUser;
exports.getUserWithMailboxes = getUserWithMailboxes;
exports.getUsersWithMailboxStatus = getUsersWithMailboxStatus;
exports.getUnlinkedMailboxes = getUnlinkedMailboxes;
exports.bulkProvisionMailboxes = bulkProvisionMailboxes;
exports.syncMailboxStatusWithUser = syncMailboxStatusWithUser;
exports.deactivateMailboxesForUser = deactivateMailboxesForUser;
exports.activateMailboxesForUser = activateMailboxesForUser;
exports.getAuditLogs = getAuditLogs;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const prisma = new client_1.PrismaClient();
function generateEmailLocalPart(firstName, lastName, format = 'firstname.lastname') {
    const first = firstName.toLowerCase().trim().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().trim().replace(/[^a-z]/g, '');
    switch (format) {
        case 'firstname.lastname':
            return `${first}.${last}`;
        case 'firstnamelastname':
            return `${first}${last}`;
        case 'firstname_lastname':
            return `${first}_${last}`;
        case 'first.last':
            return `${first.charAt(0)}.${last}`;
        case 'flastname':
            return `${first.charAt(0)}${last}`;
        case 'firstl':
            return `${first}${last.charAt(0)}`;
        default:
            return `${first}.${last}`;
    }
}
function generateSecurePassword(length = 16) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}
// ==================== AUDIT LOGGING ====================
async function logAuditAction(action, data) {
    await prisma.mailboxAuditLog.create({
        data: {
            action,
            mailboxId: data.mailboxId,
            userId: data.userId,
            domainId: data.domainId,
            performedById: data.performedById,
            companyId: data.companyId,
            details: data.details,
            success: data.success ?? true,
            errorMessage: data.errorMessage,
        },
    });
}
// ==================== SETTINGS MANAGEMENT ====================
async function getEmailHostingSettings(companyId) {
    let settings = await prisma.emailHostingSettings.findUnique({
        where: { companyId },
    });
    // Create default settings if none exist
    if (!settings) {
        settings = await prisma.emailHostingSettings.create({
            data: {
                companyId,
            },
        });
    }
    return settings;
}
async function updateEmailHostingSettings(companyId, data) {
    return prisma.emailHostingSettings.upsert({
        where: { companyId },
        update: data,
        create: {
            companyId,
            ...data,
        },
    });
}
async function provisionMailboxForUser(userId, options) {
    try {
        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true,
                mailboxes: { select: { id: true } },
            },
        });
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        // Check if user already has a primary mailbox
        if (user.primaryMailboxId) {
            return { success: false, error: 'User already has a primary mailbox' };
        }
        // Get email hosting settings
        const settings = await getEmailHostingSettings(user.companyId);
        // Determine which domain to use
        let domainId = options?.domainId || settings.defaultDomainId;
        if (!domainId) {
            // Try to find any verified domain for the company
            const domain = await prisma.emailDomain.findFirst({
                where: {
                    companyId: user.companyId,
                    isVerified: true,
                    isActive: true,
                },
            });
            if (!domain) {
                return { success: false, error: 'No verified email domain available' };
            }
            domainId = domain.id;
        }
        // Get domain details
        const domain = await prisma.emailDomain.findUnique({
            where: { id: domainId },
            include: { _count: { select: { mailboxes: true } } },
        });
        if (!domain) {
            return { success: false, error: 'Domain not found' };
        }
        if (!domain.isActive) {
            return { success: false, error: 'Domain is not active' };
        }
        if (domain._count.mailboxes >= domain.maxMailboxes) {
            return { success: false, error: 'Domain has reached maximum mailbox capacity' };
        }
        // Generate local part if not provided
        let localPart = options?.localPart;
        if (!localPart) {
            const format = (settings.emailFormat || 'firstname.lastname');
            localPart = generateEmailLocalPart(user.firstName, user.lastName, format);
        }
        // Check if mailbox already exists with this local part
        let finalLocalPart = localPart;
        let counter = 1;
        while (true) {
            const existing = await prisma.mailbox.findUnique({
                where: {
                    localPart_domainId: {
                        localPart: finalLocalPart,
                        domainId,
                    },
                },
            });
            if (!existing)
                break;
            finalLocalPart = `${localPart}${counter}`;
            counter++;
            if (counter > 100) {
                return { success: false, error: 'Unable to generate unique email address' };
            }
        }
        // Generate password if not provided
        const password = options?.password || generateSecurePassword(settings.minPasswordLength || 12);
        const passwordHash = await bcrypt.hash(password, 12);
        // Create the mailbox
        const mailbox = await prisma.mailbox.create({
            data: {
                domainId,
                localPart: finalLocalPart,
                displayName: `${user.firstName} ${user.lastName}`,
                passwordHash,
                quotaMb: settings.defaultQuotaMb || 5120,
                maxSendPerDay: settings.defaultMaxSendPerDay || 500,
                userId,
            },
            include: {
                domain: { select: { domain: true } },
            },
        });
        // Update user's primary mailbox
        await prisma.user.update({
            where: { id: userId },
            data: { primaryMailboxId: mailbox.id },
        });
        // Log the action
        await logAuditAction(client_1.MailboxAuditAction.USER_PROVISIONED_MAILBOX, {
            mailboxId: mailbox.id,
            userId,
            domainId,
            performedById: options?.performedById,
            companyId: user.companyId,
            details: {
                email: `${finalLocalPart}@${mailbox.domain.domain}`,
                autoProvisioned: !options?.localPart,
            },
        });
        return {
            success: true,
            mailbox: {
                ...mailbox,
                email: `${finalLocalPart}@${mailbox.domain.domain}`,
            },
            password: options?.password ? undefined : password, // Only return generated password
        };
    }
    catch (error) {
        return { success: false, error: error.message || 'Failed to provision mailbox' };
    }
}
// ==================== LINK/UNLINK OPERATIONS ====================
async function linkMailboxToUser(userId, mailboxId, options) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
        });
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        const mailbox = await prisma.mailbox.findUnique({
            where: { id: mailboxId },
            include: { domain: true },
        });
        if (!mailbox) {
            return { success: false, error: 'Mailbox not found' };
        }
        // Check if mailbox is already linked to another user
        if (mailbox.userId && mailbox.userId !== userId) {
            return { success: false, error: 'Mailbox is already linked to another user' };
        }
        // Link the mailbox
        await prisma.mailbox.update({
            where: { id: mailboxId },
            data: { userId },
        });
        // Set as primary if requested or if user has no primary
        if (options?.setAsPrimary || !user.primaryMailboxId) {
            await prisma.user.update({
                where: { id: userId },
                data: { primaryMailboxId: mailboxId },
            });
        }
        // Log the action
        await logAuditAction(client_1.MailboxAuditAction.MAILBOX_LINKED_TO_USER, {
            mailboxId,
            userId,
            domainId: mailbox.domainId,
            performedById: options?.performedById,
            companyId: user.companyId,
            details: {
                email: `${mailbox.localPart}@${mailbox.domain.domain}`,
                setAsPrimary: options?.setAsPrimary || !user.primaryMailboxId,
            },
        });
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message || 'Failed to link mailbox' };
    }
}
async function unlinkMailboxFromUser(mailboxId, options) {
    try {
        const mailbox = await prisma.mailbox.findUnique({
            where: { id: mailboxId },
            include: { domain: true, user: true },
        });
        if (!mailbox) {
            return { success: false, error: 'Mailbox not found' };
        }
        if (!mailbox.userId) {
            return { success: false, error: 'Mailbox is not linked to any user' };
        }
        const userId = mailbox.userId;
        const user = mailbox.user;
        // If this was the primary mailbox, clear it
        if (user?.primaryMailboxId === mailboxId) {
            // Find another mailbox to set as primary, or set to null
            const otherMailbox = await prisma.mailbox.findFirst({
                where: {
                    userId,
                    id: { not: mailboxId },
                },
            });
            await prisma.user.update({
                where: { id: userId },
                data: { primaryMailboxId: otherMailbox?.id || null },
            });
        }
        // Unlink the mailbox
        await prisma.mailbox.update({
            where: { id: mailboxId },
            data: { userId: null },
        });
        // Log the action
        if (user) {
            await logAuditAction(client_1.MailboxAuditAction.MAILBOX_UNLINKED_FROM_USER, {
                mailboxId,
                userId,
                domainId: mailbox.domainId,
                performedById: options?.performedById,
                companyId: user.companyId,
                details: {
                    email: `${mailbox.localPart}@${mailbox.domain.domain}`,
                },
            });
        }
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message || 'Failed to unlink mailbox' };
    }
}
// ==================== USER QUERIES ====================
async function getUserWithMailboxes(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            mailboxes: {
                include: {
                    domain: { select: { domain: true } },
                },
            },
        },
    });
}
async function getUsersWithMailboxStatus(companyId) {
    const users = await prisma.user.findMany({
        where: { companyId },
        include: {
            mailboxes: {
                include: {
                    domain: { select: { domain: true, isVerified: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => {
        const primaryMailbox = user.mailboxes.find((m) => m.id === user.primaryMailboxId);
        return {
            ...user,
            hasMailbox: user.mailboxes.length > 0,
            mailboxCount: user.mailboxes.length,
            primaryEmail: primaryMailbox
                ? `${primaryMailbox.localPart}@${primaryMailbox.domain.domain}`
                : null,
            mailboxStatus: primaryMailbox
                ? primaryMailbox.isActive
                    ? 'active'
                    : 'inactive'
                : 'none',
        };
    });
}
async function getUnlinkedMailboxes(companyId) {
    // Get all domains for the company
    const domains = await prisma.emailDomain.findMany({
        where: { companyId },
        select: { id: true },
    });
    const domainIds = domains.map((d) => d.id);
    // Get mailboxes without users
    return prisma.mailbox.findMany({
        where: {
            domainId: { in: domainIds },
            userId: null,
        },
        include: {
            domain: { select: { domain: true } },
        },
        orderBy: { localPart: 'asc' },
    });
}
async function bulkProvisionMailboxes(userIds, options) {
    const results = [];
    for (const userId of userIds) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, firstName: true, lastName: true, primaryMailboxId: true },
        });
        if (!user) {
            results.push({
                userId,
                userName: 'Unknown',
                success: false,
                error: 'User not found',
            });
            continue;
        }
        if (user.primaryMailboxId) {
            results.push({
                userId,
                userName: `${user.firstName} ${user.lastName}`,
                success: false,
                error: 'User already has a mailbox',
            });
            continue;
        }
        const result = await provisionMailboxForUser(userId, {
            domainId: options?.domainId,
            performedById: options?.performedById,
        });
        results.push({
            userId,
            userName: `${user.firstName} ${user.lastName}`,
            success: result.success,
            email: result.mailbox?.email,
            password: result.password,
            error: result.error,
        });
    }
    return {
        total: userIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
    };
}
// ==================== SYNC OPERATIONS ====================
async function syncMailboxStatusWithUser(mailboxId) {
    const mailbox = await prisma.mailbox.findUnique({
        where: { id: mailboxId },
        include: { user: true },
    });
    if (!mailbox || !mailbox.user)
        return;
    // Sync mailbox active status with user active status
    if (mailbox.isActive !== mailbox.user.isActive) {
        await prisma.mailbox.update({
            where: { id: mailboxId },
            data: { isActive: mailbox.user.isActive },
        });
    }
}
async function deactivateMailboxesForUser(userId) {
    await prisma.mailbox.updateMany({
        where: { userId },
        data: { isActive: false },
    });
}
async function activateMailboxesForUser(userId) {
    await prisma.mailbox.updateMany({
        where: { userId },
        data: { isActive: true },
    });
}
// ==================== AUDIT LOG QUERIES ====================
async function getAuditLogs(companyId, options) {
    const where = { companyId };
    if (options?.userId)
        where.userId = options.userId;
    if (options?.mailboxId)
        where.mailboxId = options.mailboxId;
    if (options?.action)
        where.action = options.action;
    const [logs, total] = await Promise.all([
        prisma.mailboxAuditLog.findMany({
            where,
            take: options?.limit ?? 50,
            skip: options?.offset ?? 0,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.mailboxAuditLog.count({ where }),
    ]);
    return { logs, total };
}
exports.default = {
    // Settings
    getEmailHostingSettings,
    updateEmailHostingSettings,
    // Provisioning
    provisionMailboxForUser,
    // Link/Unlink
    linkMailboxToUser,
    unlinkMailboxFromUser,
    // Queries
    getUserWithMailboxes,
    getUsersWithMailboxStatus,
    getUnlinkedMailboxes,
    // Bulk Operations
    bulkProvisionMailboxes,
    // Sync
    syncMailboxStatusWithUser,
    deactivateMailboxesForUser,
    activateMailboxesForUser,
    // Audit
    getAuditLogs,
};
