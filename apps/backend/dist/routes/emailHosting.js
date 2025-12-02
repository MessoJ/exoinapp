"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = emailHostingRoutes;
const emailHostingService_1 = __importDefault(require("../services/emailHostingService"));
async function emailHostingRoutes(fastify) {
    // Add authentication to all routes in this plugin
    fastify.addHook('preHandler', fastify.authenticate);
    // ==================== DOMAIN ROUTES ====================
    // Get all domains for company
    fastify.get('/domains', async (request, reply) => {
        try {
            const user = request.user;
            const domains = await emailHostingService_1.default.getDomainsByCompany(user.companyId);
            return { success: true, domains };
        }
        catch (error) {
            console.error('Error fetching domains:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Create a new domain
    fastify.post('/domains', async (request, reply) => {
        try {
            const user = request.user;
            const { domain, maxMailboxes, maxAliases, totalStorageQuotaMb } = request.body;
            if (!domain) {
                return reply.status(400).send({ success: false, error: 'Domain name is required' });
            }
            // Validate domain format
            const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
            if (!domainRegex.test(domain)) {
                return reply.status(400).send({ success: false, error: 'Invalid domain format' });
            }
            const emailDomain = await emailHostingService_1.default.createEmailDomain(domain, user.companyId, { maxMailboxes, maxAliases, totalStorageQuotaMb });
            return { success: true, domain: emailDomain };
        }
        catch (error) {
            console.error('Error creating domain:', error);
            if (error.code === 'P2002') {
                return reply.status(400).send({ success: false, error: 'Domain already exists' });
            }
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Get domain by ID
    fastify.get('/domains/:domainId', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const domain = await emailHostingService_1.default.getDomainById(domainId);
            if (!domain) {
                return reply.status(404).send({ success: false, error: 'Domain not found' });
            }
            return { success: true, domain };
        }
        catch (error) {
            console.error('Error fetching domain:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Get DNS records for domain
    fastify.get('/domains/:domainId/dns', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const records = await emailHostingService_1.default.getDomainDNSRecords(domainId);
            return { success: true, records };
        }
        catch (error) {
            console.error('Error fetching DNS records:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Verify DNS records
    fastify.post('/domains/:domainId/verify', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const result = await emailHostingService_1.default.verifyDNSRecords(domainId);
            return { success: true, ...result };
        }
        catch (error) {
            console.error('Error verifying DNS records:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Get domain statistics
    fastify.get('/domains/:domainId/stats', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const stats = await emailHostingService_1.default.getDomainStats(domainId);
            return { success: true, stats };
        }
        catch (error) {
            console.error('Error fetching domain stats:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Delete domain
    fastify.delete('/domains/:domainId', async (request, reply) => {
        try {
            const { domainId } = request.params;
            await emailHostingService_1.default.deleteEmailDomain(domainId);
            return { success: true, message: 'Domain deleted successfully' };
        }
        catch (error) {
            console.error('Error deleting domain:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // ==================== MAILBOX ROUTES ====================
    // Get mailboxes for domain
    fastify.get('/domains/:domainId/mailboxes', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const mailboxes = await emailHostingService_1.default.getMailboxesByDomain(domainId);
            return { success: true, mailboxes };
        }
        catch (error) {
            console.error('Error fetching mailboxes:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Create mailbox
    fastify.post('/domains/:domainId/mailboxes', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const { localPart, password, displayName, quotaMb, isAdmin } = request.body;
            if (!localPart || !password) {
                return reply.status(400).send({ success: false, error: 'Email address and password are required' });
            }
            if (password.length < 8) {
                return reply.status(400).send({ success: false, error: 'Password must be at least 8 characters' });
            }
            const mailbox = await emailHostingService_1.default.createMailbox(domainId, localPart, password, {
                displayName,
                quotaMb,
                isAdmin
            });
            return { success: true, mailbox };
        }
        catch (error) {
            console.error('Error creating mailbox:', error);
            if (error.code === 'P2002') {
                return reply.status(400).send({ success: false, error: 'Mailbox already exists' });
            }
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Get mailbox by ID
    fastify.get('/mailboxes/:mailboxId', async (request, reply) => {
        try {
            const { mailboxId } = request.params;
            const mailbox = await emailHostingService_1.default.getMailboxById(mailboxId);
            if (!mailbox) {
                return reply.status(404).send({ success: false, error: 'Mailbox not found' });
            }
            // Don't send password hash
            const { passwordHash, ...safeMailbox } = mailbox;
            return { success: true, mailbox: safeMailbox };
        }
        catch (error) {
            console.error('Error fetching mailbox:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Update mailbox
    fastify.patch('/mailboxes/:mailboxId', async (request, reply) => {
        try {
            const { mailboxId } = request.params;
            const data = { ...request.body };
            // Convert date strings to Date objects
            if (data.autoReplyStart)
                data.autoReplyStart = new Date(data.autoReplyStart);
            if (data.autoReplyEnd)
                data.autoReplyEnd = new Date(data.autoReplyEnd);
            const mailbox = await emailHostingService_1.default.updateMailbox(mailboxId, data);
            return { success: true, mailbox };
        }
        catch (error) {
            console.error('Error updating mailbox:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Update mailbox password
    fastify.post('/mailboxes/:mailboxId/password', async (request, reply) => {
        try {
            const { mailboxId } = request.params;
            const { password } = request.body;
            if (!password || password.length < 8) {
                return reply.status(400).send({ success: false, error: 'Password must be at least 8 characters' });
            }
            await emailHostingService_1.default.updateMailboxPassword(mailboxId, password);
            return { success: true, message: 'Password updated successfully' };
        }
        catch (error) {
            console.error('Error updating mailbox password:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Delete mailbox
    fastify.delete('/mailboxes/:mailboxId', async (request, reply) => {
        try {
            const { mailboxId } = request.params;
            await emailHostingService_1.default.deleteMailbox(mailboxId);
            return { success: true, message: 'Mailbox deleted successfully' };
        }
        catch (error) {
            console.error('Error deleting mailbox:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // ==================== ALIAS ROUTES ====================
    // Get aliases for domain
    fastify.get('/domains/:domainId/aliases', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const aliases = await emailHostingService_1.default.getAliasesByDomain(domainId);
            return { success: true, aliases };
        }
        catch (error) {
            console.error('Error fetching aliases:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Create alias
    fastify.post('/domains/:domainId/aliases', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const { localPart, targetMailboxId, externalTarget } = request.body;
            if (!localPart) {
                return reply.status(400).send({ success: false, error: 'Alias name is required' });
            }
            if (!targetMailboxId && !externalTarget) {
                return reply.status(400).send({ success: false, error: 'Target mailbox or external address is required' });
            }
            const alias = await emailHostingService_1.default.createEmailAlias(domainId, localPart, {
                mailboxId: targetMailboxId,
                externalAddress: externalTarget
            });
            return { success: true, alias };
        }
        catch (error) {
            console.error('Error creating alias:', error);
            if (error.code === 'P2002') {
                return reply.status(400).send({ success: false, error: 'Alias already exists' });
            }
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Update alias
    fastify.patch('/aliases/:aliasId', async (request, reply) => {
        try {
            const { aliasId } = request.params;
            const data = { ...request.body };
            // Map the body fields to the correct names
            if (data.targetMailboxId !== undefined) {
                data.targetMailboxId = data.targetMailboxId;
            }
            if (data.externalTarget !== undefined) {
                data.externalTarget = data.externalTarget;
            }
            const alias = await emailHostingService_1.default.updateEmailAlias(aliasId, data);
            return { success: true, alias };
        }
        catch (error) {
            console.error('Error updating alias:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // Delete alias
    fastify.delete('/aliases/:aliasId', async (request, reply) => {
        try {
            const { aliasId } = request.params;
            await emailHostingService_1.default.deleteEmailAlias(aliasId);
            return { success: true, message: 'Alias deleted successfully' };
        }
        catch (error) {
            console.error('Error deleting alias:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
    // ==================== EMAIL LOGS ====================
    fastify.get('/domains/:domainId/logs', async (request, reply) => {
        try {
            const { domainId } = request.params;
            const { direction, status, limit, offset } = request.query;
            const result = await emailHostingService_1.default.getEmailLogs(domainId, {
                direction: direction,
                status,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined
            });
            return { success: true, ...result };
        }
        catch (error) {
            console.error('Error fetching email logs:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
