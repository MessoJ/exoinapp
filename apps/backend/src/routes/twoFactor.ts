import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { twoFactorService } from '../services/twoFactorService';

export default async function twoFactorRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', (fastify as any).authenticate);

  // Get 2FA status for current user
  fastify.get('/status', async (request, reply) => {
    const userId = (request.user as any).id;
    const status = await twoFactorService.getTwoFactorStatus(userId);
    return reply.send(status);
  });

  // Setup 2FA - generate secret and QR code
  fastify.post('/setup', async (request, reply) => {
    const userId = (request.user as any).id;
    const userEmail = (request.user as any).email;

    const setupData = await twoFactorService.setupTwoFactor(userId, userEmail);
    
    if (!setupData) {
      return reply.status(500).send({ error: 'Failed to setup 2FA' });
    }

    return reply.send(setupData);
  });

  // Enable 2FA - verify token and activate
  fastify.post<{
    Body: { token: string };
  }>('/enable', async (request, reply) => {
    const userId = (request.user as any).id;
    const { token } = request.body;

    if (!token) {
      return reply.status(400).send({ error: 'Token is required' });
    }

    const result = await twoFactorService.enableTwoFactor(userId, token);
    
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
  fastify.post<{
    Body: { token: string };
  }>('/disable', async (request, reply) => {
    const userId = (request.user as any).id;
    const { token } = request.body;

    if (!token) {
      return reply.status(400).send({ error: 'Token is required' });
    }

    const success = await twoFactorService.disableTwoFactor(userId, token);
    
    if (!success) {
      return reply.status(400).send({ error: 'Invalid token or failed to disable 2FA' });
    }

    return reply.send({
      success: true,
      message: 'Two-factor authentication disabled successfully',
    });
  });

  // Verify 2FA token (for login flow)
  fastify.post<{
    Body: { token: string };
  }>('/verify', async (request, reply) => {
    const userId = (request.user as any).id;
    const { token } = request.body;

    if (!token) {
      return reply.status(400).send({ error: 'Token is required' });
    }

    const isValid = await twoFactorService.verifyToken(userId, token);
    
    return reply.send({ valid: isValid });
  });

  // Verify backup code
  fastify.post<{
    Body: { code: string };
  }>('/verify-backup', async (request, reply) => {
    const userId = (request.user as any).id;
    const { code } = request.body;

    if (!code) {
      return reply.status(400).send({ error: 'Backup code is required' });
    }

    const isValid = await twoFactorService.verifyBackupCode(userId, code);
    
    return reply.send({ valid: isValid });
  });

  // Regenerate backup codes
  fastify.post<{
    Body: { token: string };
  }>('/regenerate-backup', async (request, reply) => {
    const userId = (request.user as any).id;
    const { token } = request.body;

    if (!token) {
      return reply.status(400).send({ error: 'Token is required' });
    }

    const backupCodes = await twoFactorService.regenerateBackupCodes(userId, token);
    
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
