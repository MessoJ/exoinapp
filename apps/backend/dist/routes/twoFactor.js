"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = twoFactorRoutes;
const twoFactorService_1 = require("../services/twoFactorService");
async function twoFactorRoutes(fastify) {
    // All routes require authentication
    fastify.addHook('preHandler', fastify.authenticate);
    // Get 2FA status for current user
    fastify.get('/status', async (request, reply) => {
        const userId = request.user.id;
        const status = await twoFactorService_1.twoFactorService.getTwoFactorStatus(userId);
        return reply.send(status);
    });
    // Setup 2FA - generate secret and QR code
    fastify.post('/setup', async (request, reply) => {
        const userId = request.user.id;
        const userEmail = request.user.email;
        const setupData = await twoFactorService_1.twoFactorService.setupTwoFactor(userId, userEmail);
        if (!setupData) {
            return reply.status(500).send({ error: 'Failed to setup 2FA' });
        }
        return reply.send(setupData);
    });
    // Enable 2FA - verify token and activate
    fastify.post('/enable', async (request, reply) => {
        const userId = request.user.id;
        const { token } = request.body;
        if (!token) {
            return reply.status(400).send({ error: 'Token is required' });
        }
        const result = await twoFactorService_1.twoFactorService.enableTwoFactor(userId, token);
        if (!result.success) {
            return reply.status(400).send({ error: result.error || 'Failed to enable 2FA' });
        }
        return reply.send({
            success: true,
            backupCodes: result.backupCodes,
            message: 'Two-factor authentication enabled successfully',
        });
    });
    // Disable 2FA
    fastify.post('/disable', async (request, reply) => {
        const userId = request.user.id;
        const { token } = request.body;
        if (!token) {
            return reply.status(400).send({ error: 'Token is required' });
        }
        const success = await twoFactorService_1.twoFactorService.disableTwoFactor(userId, token);
        if (!success) {
            return reply.status(400).send({ error: 'Invalid token or failed to disable 2FA' });
        }
        return reply.send({
            success: true,
            message: 'Two-factor authentication disabled successfully',
        });
    });
    // Verify 2FA token (for login flow)
    fastify.post('/verify', async (request, reply) => {
        const userId = request.user.id;
        const { token } = request.body;
        if (!token) {
            return reply.status(400).send({ error: 'Token is required' });
        }
        const isValid = await twoFactorService_1.twoFactorService.verifyToken(userId, token);
        return reply.send({ valid: isValid });
    });
    // Verify backup code
    fastify.post('/verify-backup', async (request, reply) => {
        const userId = request.user.id;
        const { code } = request.body;
        if (!code) {
            return reply.status(400).send({ error: 'Backup code is required' });
        }
        const isValid = await twoFactorService_1.twoFactorService.verifyBackupCode(userId, code);
        return reply.send({ valid: isValid });
    });
    // Regenerate backup codes
    fastify.post('/regenerate-backup', async (request, reply) => {
        const userId = request.user.id;
        const { token } = request.body;
        if (!token) {
            return reply.status(400).send({ error: 'Token is required' });
        }
        const backupCodes = await twoFactorService_1.twoFactorService.regenerateBackupCodes(userId, token);
        if (!backupCodes) {
            return reply.status(400).send({ error: 'Invalid token or failed to regenerate codes' });
        }
        return reply.send({
            success: true,
            backupCodes,
            message: 'Backup codes regenerated successfully',
        });
    });
}
