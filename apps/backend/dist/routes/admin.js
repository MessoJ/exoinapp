"use strict";
/**
 * Admin Routes - Unified User and Mailbox Management
 *
 * Provides admin-only endpoints for:
 * - Viewing all users with their mailboxes
 * - Provisioning/deprovisioning mailboxes
 * - Syncing user profiles with mailboxes
 * - Bulk operations
 * - Audit logs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminRoutes;
const index_1 = require("../index");
const userMailboxLinkService_1 = __importDefault(require("../services/userMailboxLinkService"));
const client_1 = require("@prisma/client");
// Middleware to check admin role
const adminOnly = async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Admin access required' });
    }
};
async function adminRoutes(fastify) {
    // ==========================================
    // USERS WITH MAILBOXES
    // ==========================================
    // Get all users with their mailbox information
    fastify.get('/users-with-mailboxes', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { search, hasMailbox, role, page = '1', limit = '50' } = request.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = { companyId };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (hasMailbox === 'true') {
            where.mailboxes = { some: {} };
        }
        else if (hasMailbox === 'false') {
            where.mailboxes = { none: {} };
        }
        if (role) {
            where.role = role;
        }
        const [users, total] = await Promise.all([
            index_1.prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    mailboxes: {
                        include: {
                            domain: {
                                select: {
                                    id: true,
                                    domain: true,
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    { firstName: 'asc' },
                    { lastName: 'asc' }
                ]
            }),
            index_1.prisma.user.count({ where })
        ]);
        // Transform data for frontend
        const usersWithMailboxInfo = users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            role: user.role,
            jobTitle: user.jobTitle,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            ssoProvider: user.ssoProvider,
            primaryMailboxId: user.primaryMailboxId,
            autoProvisionEmail: user.autoProvisionEmail,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            mailboxes: user.mailboxes.map(mb => ({
                id: mb.id,
                localPart: mb.localPart,
                domain: mb.domain?.domain,
                domainId: mb.domainId,
                fullAddress: `${mb.localPart}@${mb.domain?.domain}`,
                displayName: mb.displayName,
                quotaMb: mb.quotaMb,
                usedMb: mb.usedMb,
                quotaPercent: mb.quotaMb ? Math.round((mb.usedMb / mb.quotaMb) * 100) : 0,
                isActive: mb.isActive,
                hasSignature: !!mb.signatureHtml,
                createdAt: mb.createdAt,
            })),
            hasMailbox: user.mailboxes.length > 0,
            mailboxCount: user.mailboxes.length,
        }));
        return {
            users: usersWithMailboxInfo,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            stats: {
                totalUsers: total,
                withMailbox: usersWithMailboxInfo.filter(u => u.hasMailbox).length,
                withoutMailbox: usersWithMailboxInfo.filter(u => !u.hasMailbox).length,
            }
        };
    });
    // Get single user with full mailbox details
    fastify.get('/users/:userId/mailboxes', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { userId } = request.params;
        const { companyId } = request.user;
        const user = await index_1.prisma.user.findFirst({
            where: { id: userId, companyId },
            include: {
                mailboxes: {
                    include: {
                        domain: true,
                    }
                }
            }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        // Fetch aliases separately
        const mailboxIds = user.mailboxes.map(m => m.id);
        const aliases = await index_1.prisma.emailAlias.findMany({
            where: { targetMailboxId: { in: mailboxIds } },
            include: { domain: { select: { domain: true } } }
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                jobTitle: user.jobTitle,
                autoProvisionEmail: user.autoProvisionEmail,
                primaryMailboxId: user.primaryMailboxId,
            },
            mailboxes: user.mailboxes.map(mb => ({
                id: mb.id,
                localPart: mb.localPart,
                domain: mb.domain?.domain,
                domainId: mb.domainId,
                fullAddress: `${mb.localPart}@${mb.domain?.domain}`,
                displayName: mb.displayName,
                quotaMb: mb.quotaMb,
                usedMb: mb.usedMb,
                isActive: mb.isActive,
                hasSignature: !!mb.signatureHtml,
                isPrimary: mb.id === user.primaryMailboxId,
                aliases: aliases.filter(a => a.targetMailboxId === mb.id).map(a => ({
                    id: a.id,
                    localPart: a.localPart,
                    domain: a.domain?.domain,
                    fullAddress: `${a.localPart}@${a.domain?.domain}`,
                    isActive: a.isActive,
                })),
                createdAt: mb.createdAt,
                updatedAt: mb.updatedAt,
            }))
        };
    });
    // ==========================================
    // MAILBOX PROVISIONING
    // ==========================================
    // Provision mailbox for user
    fastify.post('/users/:userId/mailbox', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { userId } = request.params;
        const { domainId, localPart, quotaMb, displayName, setAsPrimary = true } = request.body;
        const { companyId, id: adminId } = request.user;
        // Verify user belongs to company
        const user = await index_1.prisma.user.findFirst({
            where: { id: userId, companyId }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        // Verify domain belongs to company
        const domain = await index_1.prisma.emailDomain.findFirst({
            where: { id: domainId, companyId }
        });
        if (!domain) {
            return reply.status(404).send({ error: 'Domain not found' });
        }
        try {
            const result = await userMailboxLinkService_1.default.provisionMailboxForUser(userId, {
                domainId,
                localPart: localPart || user.email.split('@')[0],
                performedById: adminId,
            });
            if (!result.success || !result.mailbox) {
                return reply.status(400).send({ error: result.error || 'Failed to provision mailbox' });
            }
            // Log the action
            await index_1.prisma.mailboxAuditLog.create({
                data: {
                    action: client_1.MailboxAuditAction.MAILBOX_CREATED,
                    userId: adminId,
                    mailboxId: result.mailbox.id,
                    companyId,
                    details: {
                        provisionedBy: adminId,
                        targetUser: userId,
                        mailboxAddress: result.mailbox.fullAddress,
                    },
                    ipAddress: request.ip,
                    userAgent: request.headers['user-agent'] || null,
                }
            });
            return {
                success: true,
                message: 'Mailbox provisioned successfully',
                mailbox: result.mailbox,
            };
        }
        catch (error) {
            return reply.status(400).send({
                error: error.message || 'Failed to provision mailbox'
            });
        }
    });
    // Deprovision (delete) mailbox
    fastify.delete('/users/:userId/mailbox/:mailboxId', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { userId, mailboxId } = request.params;
        const { companyId, id: adminId } = request.user;
        // Verify ownership
        const mailbox = await index_1.prisma.mailbox.findFirst({
            where: {
                id: mailboxId,
                userId,
                domain: { companyId }
            },
            include: {
                domain: { select: { domain: true } }
            }
        });
        if (!mailbox) {
            return reply.status(404).send({ error: 'Mailbox not found' });
        }
        const fullAddress = `${mailbox.localPart}@${mailbox.domain?.domain}`;
        // Log before deletion
        await index_1.prisma.mailboxAuditLog.create({
            data: {
                action: client_1.MailboxAuditAction.MAILBOX_DELETED,
                userId: adminId,
                mailboxId,
                companyId,
                details: {
                    deletedBy: adminId,
                    targetUser: userId,
                    mailboxAddress: fullAddress,
                },
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'] || null,
            }
        });
        // Delete mailbox
        await index_1.prisma.mailbox.delete({
            where: { id: mailboxId }
        });
        // If this was the primary mailbox, clear it
        await index_1.prisma.user.updateMany({
            where: { id: userId, primaryMailboxId: mailboxId },
            data: { primaryMailboxId: null }
        });
        return {
            success: true,
            message: `Mailbox ${fullAddress} deleted successfully`,
        };
    });
    // Set primary mailbox
    fastify.put('/users/:userId/primary-mailbox', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { userId } = request.params;
        const { mailboxId } = request.body;
        const { companyId } = request.user;
        // Verify mailbox belongs to user
        const mailbox = await index_1.prisma.mailbox.findFirst({
            where: {
                id: mailboxId,
                userId,
                domain: { companyId }
            }
        });
        if (!mailbox) {
            return reply.status(404).send({ error: 'Mailbox not found' });
        }
        await index_1.prisma.user.update({
            where: { id: userId },
            data: { primaryMailboxId: mailboxId }
        });
        return {
            success: true,
            message: 'Primary mailbox updated',
        };
    });
    // ==========================================
    // SYNC OPERATIONS
    // ==========================================
    // Sync user profile to mailbox
    fastify.post('/users/:userId/sync-to-mailbox', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { userId } = request.params;
        const { companyId } = request.user;
        const user = await index_1.prisma.user.findFirst({
            where: { id: userId, companyId },
            include: {
                mailboxes: true,
                company: true
            }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        if (user.mailboxes.length === 0) {
            return reply.status(400).send({ error: 'User has no mailboxes' });
        }
        // Sync display name to all mailboxes
        const fullName = `${user.firstName} ${user.lastName}`;
        await index_1.prisma.mailbox.updateMany({
            where: { userId },
            data: {
                displayName: fullName,
                updatedAt: new Date()
            }
        });
        return {
            success: true,
            message: `Synced profile to ${user.mailboxes.length} mailbox(es)`,
            synced: {
                displayName: fullName,
                mailboxCount: user.mailboxes.length
            }
        };
    });
    // ==========================================
    // BULK OPERATIONS
    // ==========================================
    // Bulk provision mailboxes
    fastify.post('/bulk/provision-mailboxes', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { userIds, domainId, quotaMb } = request.body;
        const { companyId, id: adminId } = request.user;
        if (!userIds || userIds.length === 0) {
            return reply.status(400).send({ error: 'No users specified' });
        }
        // Verify domain
        const domain = await index_1.prisma.emailDomain.findFirst({
            where: { id: domainId, companyId }
        });
        if (!domain) {
            return reply.status(404).send({ error: 'Domain not found' });
        }
        const results = {
            success: [],
            failed: [],
        };
        for (const userId of userIds) {
            try {
                const user = await index_1.prisma.user.findFirst({
                    where: { id: userId, companyId },
                    include: { mailboxes: true }
                });
                if (!user) {
                    results.failed.push({ userId, error: 'User not found' });
                    continue;
                }
                if (user.mailboxes.length > 0) {
                    results.failed.push({ userId, error: 'User already has a mailbox' });
                    continue;
                }
                const result = await userMailboxLinkService_1.default.provisionMailboxForUser(userId, {
                    domainId,
                    localPart: user.email.split('@')[0],
                    performedById: request.user.id,
                });
                if (result.success && result.mailbox) {
                    results.success.push({
                        userId,
                        userName: `${user.firstName} ${user.lastName}`,
                        mailbox: result.mailbox.fullAddress,
                    });
                }
                else {
                    results.failed.push({ userId, error: result.error || 'Provisioning failed' });
                }
            }
            catch (error) {
                results.failed.push({ userId, error: error.message });
            }
        }
        return {
            success: true,
            message: `Provisioned ${results.success.length} mailboxes, ${results.failed.length} failed`,
            results
        };
    });
    // ==========================================
    // AUDIT LOG
    // ==========================================
    // Get audit log
    fastify.get('/audit-log', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { userId, mailboxId, action, page = '1', limit = '50' } = request.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = { companyId };
        if (userId)
            where.userId = userId;
        if (mailboxId)
            where.mailboxId = mailboxId;
        if (action)
            where.action = action;
        const [logs, total] = await Promise.all([
            index_1.prisma.mailboxAuditLog.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            index_1.prisma.mailboxAuditLog.count({ where })
        ]);
        // Fetch user info for logs that have performedById
        const performerIds = [...new Set(logs.map(l => l.performedById).filter(Boolean))];
        const performers = performerIds.length > 0
            ? await index_1.prisma.user.findMany({
                where: { id: { in: performerIds } },
                select: { id: true, email: true, firstName: true, lastName: true }
            })
            : [];
        const performerMap = new Map(performers.map(u => [u.id, u]));
        return {
            logs: logs.map(log => {
                const performer = log.performedById ? performerMap.get(log.performedById) : null;
                return {
                    id: log.id,
                    action: log.action,
                    performedBy: performer ? {
                        id: performer.id,
                        email: performer.email,
                        name: `${performer.firstName} ${performer.lastName}`,
                    } : null,
                    userId: log.userId,
                    mailboxId: log.mailboxId,
                    details: log.details,
                    ipAddress: log.ipAddress,
                    success: log.success,
                    errorMessage: log.errorMessage,
                    createdAt: log.createdAt,
                };
            }),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        };
    });
    // ==========================================
    // DOMAINS MANAGEMENT
    // ==========================================
    // Get domains with mailbox counts
    fastify.get('/domains', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const domains = await index_1.prisma.emailDomain.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: {
                        mailboxes: true,
                        aliases: true,
                    }
                }
            }
        });
        return {
            domains: domains.map(d => ({
                id: d.id,
                domain: d.domain,
                isVerified: d.isVerified,
                isActive: d.isActive,
                mailboxCount: d._count.mailboxes,
                aliasCount: d._count.aliases,
                createdAt: d.createdAt,
            }))
        };
    });
    // ==========================================
    // DASHBOARD STATS
    // ==========================================
    // Get admin dashboard stats
    fastify.get('/dashboard-stats', {
        preHandler: [fastify.authenticate, adminOnly]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const [totalUsers, activeUsers, usersWithMailbox, totalMailboxes, activeMailboxes, totalDomains, verifiedDomains, totalAliases, recentActivity] = await Promise.all([
            index_1.prisma.user.count({ where: { companyId } }),
            index_1.prisma.user.count({ where: { companyId, isActive: true } }),
            index_1.prisma.user.count({ where: { companyId, mailboxes: { some: {} } } }),
            index_1.prisma.mailbox.count({ where: { domain: { companyId } } }),
            index_1.prisma.mailbox.count({ where: { domain: { companyId }, isActive: true } }),
            index_1.prisma.emailDomain.count({ where: { companyId } }),
            index_1.prisma.emailDomain.count({ where: { companyId, isVerified: true } }),
            index_1.prisma.emailAlias.count({ where: { domain: { companyId } } }),
            index_1.prisma.mailboxAuditLog.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            })
        ]);
        // Fetch performer info for recent activity
        const performerIds = [...new Set(recentActivity.map(a => a.performedById).filter(Boolean))];
        const performers = performerIds.length > 0
            ? await index_1.prisma.user.findMany({
                where: { id: { in: performerIds } },
                select: { id: true, firstName: true, lastName: true }
            })
            : [];
        const performerMap = new Map(performers.map(u => [u.id, u]));
        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                withMailbox: usersWithMailbox,
                withoutMailbox: totalUsers - usersWithMailbox,
                mailboxCoverage: totalUsers > 0 ? Math.round((usersWithMailbox / totalUsers) * 100) : 0,
            },
            mailboxes: {
                total: totalMailboxes,
                active: activeMailboxes,
                inactive: totalMailboxes - activeMailboxes,
            },
            domains: {
                total: totalDomains,
                verified: verifiedDomains,
                unverified: totalDomains - verifiedDomains,
            },
            aliases: {
                total: totalAliases,
            },
            recentActivity: recentActivity.map(a => {
                const performer = a.performedById ? performerMap.get(a.performedById) : null;
                return {
                    action: a.action,
                    performedBy: performer ? `${performer.firstName} ${performer.lastName}` : 'System',
                    details: a.details,
                    createdAt: a.createdAt,
                };
            })
        };
    });
}
