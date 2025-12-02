import { FastifyInstance } from 'fastify';
import * as argon2 from 'argon2';
import { prisma } from '../index';
import userMailboxLinkService from '../services/userMailboxLinkService';

export default async function usersRoutes(fastify: FastifyInstance) {
  
  // Get all users with mailbox status (protected, admin/manager only)
  fastify.get('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    
    // Only ADMIN and MANAGER can view all users
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    // Use the service to get users with mailbox status
    const users = await userMailboxLinkService.getUsersWithMailboxStatus(companyId);
    
    // Map isActive to status for frontend compatibility
    return users.map(u => ({
      ...u,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE'
    }));
  });

  // Get single user by ID with mailbox info
  fastify.get('/:id', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: currentUserId } = (request as any).user;
    const { id } = request.params as { id: string };
    
    // Users can view their own profile, admins/managers can view all
    if (id !== currentUserId && role !== 'ADMIN' && role !== 'MANAGER') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const user = await prisma.user.findFirst({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    
    // Only ADMIN can create users
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can create users' });
    }
    
    const { email, password, firstName, lastName, userRole, jobTitle, phone } = request.body as any;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(400).send({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await argon2.hash(password);
    
    // Create user
    const user = await prisma.user.create({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: currentUserId } = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    
    // Check if user exists in same company
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId }
    });
    
    if (!existingUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    // Build update data based on permissions
    let updateData: any = {};
    
    if (role === 'ADMIN') {
      // Admin can update all fields
      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.email !== undefined) {
        // Check if new email is already taken
        if (body.email !== existingUser.email) {
          const emailTaken = await prisma.user.findUnique({ where: { email: body.email } });
          if (emailTaken) {
            return reply.status(400).send({ error: 'Email already in use' });
          }
        }
        updateData.email = body.email;
      }
      if (body.role !== undefined) updateData.role = body.role;
      if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.status !== undefined) updateData.isActive = body.status === 'ACTIVE';
      if (body.password) {
        updateData.passwordHash = await argon2.hash(body.password);
      }
    } else if (id === currentUserId) {
      // Users can only update their own limited fields
      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.password) {
        updateData.passwordHash = await argon2.hash(body.password);
      }
    } else {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    // Perform update
    const user = await prisma.user.update({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: currentUserId } = (request as any).user;
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    
    // Only ADMIN can change status
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can change user status' });
    }
    
    // Can't deactivate yourself
    if (id === currentUserId) {
      return reply.status(400).send({ error: 'Cannot deactivate your own account' });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId }
    });
    
    if (!existingUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    const user = await prisma.user.update({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: currentUserId } = (request as any).user;
    const { id } = request.params as { id: string };
    
    // Only ADMIN can delete users
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can delete users' });
    }
    
    // Can't delete yourself
    if (id === currentUserId) {
      return reply.status(400).send({ error: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, companyId }
    });
    
    if (!existingUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    return { success: true, message: 'User deleted successfully' };
  });

  // Get user statistics (admin/manager only)
  fastify.get('/stats/summary', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const [total, active, byRole, usersWithMailbox] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId, isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { companyId },
        _count: true
      }),
      prisma.user.count({ 
        where: { 
          companyId, 
          primaryMailboxId: { not: null } 
        } 
      })
    ]);
    
    const roleStats = byRole.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<string, number>);
    
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: currentUserId } = (request as any).user;
    const { id } = request.params as { id: string };
    
    // Users can view their own, admins/managers can view all
    if (id !== currentUserId && role !== 'ADMIN' && role !== 'MANAGER') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const user = await userMailboxLinkService.getUserWithMailboxes(id);
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    if (user.companyId !== companyId) {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    return {
      userId: user.id,
      primaryMailboxId: user.primaryMailboxId,
      mailboxes: user.mailboxes.map((m: any) => ({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: performedById } = (request as any).user;
    const { id } = request.params as { id: string };
    const { domainId, localPart, password } = request.body as any;
    
    // Only ADMIN can provision mailboxes
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can provision mailboxes' });
    }
    
    // Check user exists in same company
    const user = await prisma.user.findFirst({
      where: { id, companyId }
    });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    const result = await userMailboxLinkService.provisionMailboxForUser(id, {
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: performedById } = (request as any).user;
    const { id } = request.params as { id: string };
    const { mailboxId, setAsPrimary } = request.body as any;
    
    // Only ADMIN can link mailboxes
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can link mailboxes' });
    }
    
    if (!mailboxId) {
      return reply.status(400).send({ error: 'mailboxId is required' });
    }
    
    // Check user exists in same company
    const user = await prisma.user.findFirst({
      where: { id, companyId }
    });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    const result = await userMailboxLinkService.linkMailboxToUser(id, mailboxId, {
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: performedById } = (request as any).user;
    const { id, mailboxId } = request.params as { id: string; mailboxId: string };
    
    // Only ADMIN can unlink mailboxes
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can unlink mailboxes' });
    }
    
    // Check user exists in same company
    const user = await prisma.user.findFirst({
      where: { id, companyId }
    });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    const result = await userMailboxLinkService.unlinkMailboxFromUser(mailboxId, {
      performedById
    });
    
    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }
    
    return { success: true, message: 'Mailbox unlinked successfully' };
  });

  // Bulk provision mailboxes (admin only)
  fastify.post('/mailbox/bulk-provision', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId, id: performedById } = (request as any).user;
    const { userIds, domainId } = request.body as any;
    
    // Only ADMIN can bulk provision
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only administrators can bulk provision mailboxes' });
    }
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return reply.status(400).send({ error: 'userIds array is required' });
    }
    
    // Verify all users belong to the same company
    const users = await prisma.user.findMany({
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
    
    const result = await userMailboxLinkService.bulkProvisionMailboxes(validUserIds, {
      domainId,
      performedById
    });
    
    return result;
  });

  // Get unlinked mailboxes (admin only) - for linking to users
  fastify.get('/mailbox/unlinked', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const mailboxes = await userMailboxLinkService.getUnlinkedMailboxes(companyId);
    
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const settings = await userMailboxLinkService.getEmailHostingSettings(companyId);
    
    // Get available domains for selection
    const domains = await prisma.emailDomain.findMany({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const body = request.body as any;
    
    const settings = await userMailboxLinkService.updateEmailHostingSettings(companyId, {
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { role, companyId } = (request as any).user;
    const { userId, mailboxId, action, limit, offset } = request.query as any;
    
    if (role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }
    
    const result = await userMailboxLinkService.getAuditLogs(companyId, {
      userId,
      mailboxId,
      action,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    
    return result;
  });
}
