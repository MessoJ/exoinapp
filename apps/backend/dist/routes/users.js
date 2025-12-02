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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = usersRoutes;
const argon2 = __importStar(require("argon2"));
const index_1 = require("../index");
const userMailboxLinkService_1 = __importDefault(require("../services/userMailboxLinkService"));
async function usersRoutes(fastify) {
    // Get all users with mailbox status (protected, admin/manager only)
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        // Only ADMIN and MANAGER can view all users
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        // Use the service to get users with mailbox status
        const users = await userMailboxLinkService_1.default.getUsersWithMailboxStatus(companyId);
        // Map isActive to status for frontend compatibility
        return users.map(u => ({
            ...u,
            status: u.isActive ? 'ACTIVE' : 'INACTIVE'
        }));
    });
    // Get single user by ID with mailbox info
    fastify.get('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: currentUserId } = request.user;
        const { id } = request.params;
        // Users can view their own profile, admins/managers can view all
        if (id !== currentUserId && role !== 'ADMIN' && role !== 'MANAGER') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const user = await index_1.prisma.user.findFirst({
            where: {
                id,
                companyId
            },
            include: {
                mailboxes: {
                    include: {
                        domain: { select: { domain: true, isVerified: true } }
                    }
                }
            }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const primaryMailbox = user.mailboxes.find(m => m.id === user.primaryMailboxId);
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            jobTitle: user.jobTitle,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE',
            hasMailbox: user.mailboxes.length > 0,
            mailboxCount: user.mailboxes.length,
            primaryMailboxId: user.primaryMailboxId,
            primaryEmail: primaryMailbox
                ? `${primaryMailbox.localPart}@${primaryMailbox.domain.domain}`
                : null,
            mailboxes: user.mailboxes.map(m => ({
                id: m.id,
                email: `${m.localPart}@${m.domain.domain}`,
                isActive: m.isActive,
                isPrimary: m.id === user.primaryMailboxId,
                domainVerified: m.domain.isVerified
            }))
        };
    });
    // Create new user (admin only)
    fastify.post('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        // Only ADMIN can create users
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can create users' });
        }
        const { email, password, firstName, lastName, userRole, jobTitle, phone } = request.body;
        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return reply.status(400).send({ error: 'Missing required fields' });
        }
        // Check if email already exists
        const existingUser = await index_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return reply.status(400).send({ error: 'Email already registered' });
        }
        // Hash password
        const passwordHash = await argon2.hash(password);
        // Create user
        const user = await index_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role: userRole || 'STAFF',
                jobTitle: jobTitle || null,
                phone: phone || null,
                companyId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                jobTitle: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
            }
        });
        return {
            ...user,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE'
        };
    });
    // Update user (admin only, or self for limited fields)
    fastify.put('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: currentUserId } = request.user;
        const { id } = request.params;
        const body = request.body;
        // Check if user exists in same company
        const existingUser = await index_1.prisma.user.findFirst({
            where: { id, companyId }
        });
        if (!existingUser) {
            return reply.status(404).send({ error: 'User not found' });
        }
        // Build update data based on permissions
        let updateData = {};
        if (role === 'ADMIN') {
            // Admin can update all fields
            if (body.firstName !== undefined)
                updateData.firstName = body.firstName;
            if (body.lastName !== undefined)
                updateData.lastName = body.lastName;
            if (body.email !== undefined) {
                // Check if new email is already taken
                if (body.email !== existingUser.email) {
                    const emailTaken = await index_1.prisma.user.findUnique({ where: { email: body.email } });
                    if (emailTaken) {
                        return reply.status(400).send({ error: 'Email already in use' });
                    }
                }
                updateData.email = body.email;
            }
            if (body.role !== undefined)
                updateData.role = body.role;
            if (body.jobTitle !== undefined)
                updateData.jobTitle = body.jobTitle;
            if (body.phone !== undefined)
                updateData.phone = body.phone;
            if (body.status !== undefined)
                updateData.isActive = body.status === 'ACTIVE';
            if (body.password) {
                updateData.passwordHash = await argon2.hash(body.password);
            }
        }
        else if (id === currentUserId) {
            // Users can only update their own limited fields
            if (body.firstName !== undefined)
                updateData.firstName = body.firstName;
            if (body.lastName !== undefined)
                updateData.lastName = body.lastName;
            if (body.phone !== undefined)
                updateData.phone = body.phone;
            if (body.password) {
                updateData.passwordHash = await argon2.hash(body.password);
            }
        }
        else {
            return reply.status(403).send({ error: 'Access denied' });
        }
        // Perform update
        const user = await index_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                jobTitle: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                updatedAt: true,
            }
        });
        return {
            ...user,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE'
        };
    });
    // Toggle user status (admin only)
    fastify.patch('/:id/status', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: currentUserId } = request.user;
        const { id } = request.params;
        const { status } = request.body;
        // Only ADMIN can change status
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can change user status' });
        }
        // Can't deactivate yourself
        if (id === currentUserId) {
            return reply.status(400).send({ error: 'Cannot deactivate your own account' });
        }
        // Check if user exists
        const existingUser = await index_1.prisma.user.findFirst({
            where: { id, companyId }
        });
        if (!existingUser) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const user = await index_1.prisma.user.update({
            where: { id },
            data: { isActive: status === 'ACTIVE' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            }
        });
        return {
            ...user,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE'
        };
    });
    // Delete user (admin only)
    fastify.delete('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: currentUserId } = request.user;
        const { id } = request.params;
        // Only ADMIN can delete users
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can delete users' });
        }
        // Can't delete yourself
        if (id === currentUserId) {
            return reply.status(400).send({ error: 'Cannot delete your own account' });
        }
        // Check if user exists
        const existingUser = await index_1.prisma.user.findFirst({
            where: { id, companyId }
        });
        if (!existingUser) {
            return reply.status(404).send({ error: 'User not found' });
        }
        await index_1.prisma.user.delete({
            where: { id }
        });
        return { success: true, message: 'User deleted successfully' };
    });
    // Get user statistics (admin/manager only)
    fastify.get('/stats/summary', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        if (role !== 'ADMIN' && role !== 'MANAGER') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const [total, active, byRole, usersWithMailbox] = await Promise.all([
            index_1.prisma.user.count({ where: { companyId } }),
            index_1.prisma.user.count({ where: { companyId, isActive: true } }),
            index_1.prisma.user.groupBy({
                by: ['role'],
                where: { companyId },
                _count: true
            }),
            index_1.prisma.user.count({
                where: {
                    companyId,
                    primaryMailboxId: { not: null }
                }
            })
        ]);
        const roleStats = byRole.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
        }, {});
        return {
            total,
            active,
            inactive: total - active,
            admins: roleStats['ADMIN'] || 0,
            managers: roleStats['MANAGER'] || 0,
            staff: roleStats['STAFF'] || 0,
            withMailbox: usersWithMailbox,
            withoutMailbox: total - usersWithMailbox,
        };
    });
    // ==================== MAILBOX MANAGEMENT ====================
    // Get user's mailboxes
    fastify.get('/:id/mailboxes', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: currentUserId } = request.user;
        const { id } = request.params;
        // Users can view their own, admins/managers can view all
        if (id !== currentUserId && role !== 'ADMIN' && role !== 'MANAGER') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const user = await userMailboxLinkService_1.default.getUserWithMailboxes(id);
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        if (user.companyId !== companyId) {
            return reply.status(403).send({ error: 'Access denied' });
        }
        return {
            userId: user.id,
            primaryMailboxId: user.primaryMailboxId,
            mailboxes: user.mailboxes.map((m) => ({
                id: m.id,
                email: `${m.localPart}@${m.domain.domain}`,
                displayName: m.displayName,
                isActive: m.isActive,
                isPrimary: m.id === user.primaryMailboxId,
                quotaMb: m.quotaMb,
                usedMb: m.usedMb,
                createdAt: m.createdAt,
            }))
        };
    });
    // Provision mailbox for user (admin only)
    fastify.post('/:id/mailbox', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: performedById } = request.user;
        const { id } = request.params;
        const { domainId, localPart, password } = request.body;
        // Only ADMIN can provision mailboxes
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can provision mailboxes' });
        }
        // Check user exists in same company
        const user = await index_1.prisma.user.findFirst({
            where: { id, companyId }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const result = await userMailboxLinkService_1.default.provisionMailboxForUser(id, {
            domainId,
            localPart,
            password,
            performedById
        });
        if (!result.success) {
            return reply.status(400).send({ error: result.error });
        }
        return {
            success: true,
            mailbox: result.mailbox,
            password: result.password, // Only returned if auto-generated
            message: `Mailbox ${result.mailbox.email} created successfully`
        };
    });
    // Link existing mailbox to user (admin only)
    fastify.post('/:id/mailbox/link', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: performedById } = request.user;
        const { id } = request.params;
        const { mailboxId, setAsPrimary } = request.body;
        // Only ADMIN can link mailboxes
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can link mailboxes' });
        }
        if (!mailboxId) {
            return reply.status(400).send({ error: 'mailboxId is required' });
        }
        // Check user exists in same company
        const user = await index_1.prisma.user.findFirst({
            where: { id, companyId }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const result = await userMailboxLinkService_1.default.linkMailboxToUser(id, mailboxId, {
            setAsPrimary: setAsPrimary ?? true,
            performedById
        });
        if (!result.success) {
            return reply.status(400).send({ error: result.error });
        }
        return { success: true, message: 'Mailbox linked successfully' };
    });
    // Unlink mailbox from user (admin only)
    fastify.delete('/:id/mailbox/:mailboxId', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: performedById } = request.user;
        const { id, mailboxId } = request.params;
        // Only ADMIN can unlink mailboxes
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can unlink mailboxes' });
        }
        // Check user exists in same company
        const user = await index_1.prisma.user.findFirst({
            where: { id, companyId }
        });
        if (!user) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const result = await userMailboxLinkService_1.default.unlinkMailboxFromUser(mailboxId, {
            performedById
        });
        if (!result.success) {
            return reply.status(400).send({ error: result.error });
        }
        return { success: true, message: 'Mailbox unlinked successfully' };
    });
    // Bulk provision mailboxes (admin only)
    fastify.post('/mailbox/bulk-provision', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId, id: performedById } = request.user;
        const { userIds, domainId } = request.body;
        // Only ADMIN can bulk provision
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only administrators can bulk provision mailboxes' });
        }
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return reply.status(400).send({ error: 'userIds array is required' });
        }
        // Verify all users belong to the same company
        const users = await index_1.prisma.user.findMany({
            where: {
                id: { in: userIds },
                companyId
            },
            select: { id: true }
        });
        const validUserIds = users.map(u => u.id);
        if (validUserIds.length === 0) {
            return reply.status(400).send({ error: 'No valid users found' });
        }
        const result = await userMailboxLinkService_1.default.bulkProvisionMailboxes(validUserIds, {
            domainId,
            performedById
        });
        return result;
    });
    // Get unlinked mailboxes (admin only) - for linking to users
    fastify.get('/mailbox/unlinked', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const mailboxes = await userMailboxLinkService_1.default.getUnlinkedMailboxes(companyId);
        return {
            mailboxes: mailboxes.map(m => ({
                id: m.id,
                email: `${m.localPart}@${m.domain.domain}`,
                displayName: m.displayName,
                isActive: m.isActive,
                quotaMb: m.quotaMb,
                createdAt: m.createdAt,
            }))
        };
    });
    // Get email hosting settings (admin only)
    fastify.get('/settings/email-hosting', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const settings = await userMailboxLinkService_1.default.getEmailHostingSettings(companyId);
        // Get available domains for selection
        const domains = await index_1.prisma.emailDomain.findMany({
            where: { companyId, isActive: true },
            select: { id: true, domain: true, isVerified: true }
        });
        return {
            settings,
            availableDomains: domains
        };
    });
    // Update email hosting settings (admin only)
    fastify.put('/settings/email-hosting', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const body = request.body;
        const settings = await userMailboxLinkService_1.default.updateEmailHostingSettings(companyId, {
            defaultDomainId: body.defaultDomainId,
            emailFormat: body.emailFormat,
            autoProvisionEnabled: body.autoProvisionEnabled,
            defaultQuotaMb: body.defaultQuotaMb,
            defaultMaxSendPerDay: body.defaultMaxSendPerDay,
            notifyOnProvision: body.notifyOnProvision,
            welcomeEmailTemplate: body.welcomeEmailTemplate,
            requireStrongPassword: body.requireStrongPassword,
            minPasswordLength: body.minPasswordLength,
        });
        return { success: true, settings };
    });
    // Get audit logs (admin only)
    fastify.get('/audit-logs', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { role, companyId } = request.user;
        const { userId, mailboxId, action, limit, offset } = request.query;
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Access denied' });
        }
        const result = await userMailboxLinkService_1.default.getAuditLogs(companyId, {
            userId,
            mailboxId,
            action,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        return result;
    });
}
