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

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../index';
import userMailboxLinkService from '../services/userMailboxLinkService';
import { MailboxAuditAction } from '@prisma/client';

// Middleware to check admin role
const adminOnly = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = (request as any).user;
  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
};

export default async function adminRoutes(fastify: FastifyInstance) {
  
  // ==========================================
  // USERS WITH MAILBOXES
  // ==========================================

  // Get all users with their mailbox information
  fastify.get('/users-with-mailboxes', {
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const { 
      search, 
      hasMailbox, 
      role, 
      page = '1', 
      limit = '50' 
    } = request.query as { 
      search?: string; 
      hasMailbox?: string; 
      role?: string; 
      page?: string; 
      limit?: string 
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { companyId };
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (hasMailbox === 'true') {
      where.mailboxes = { some: {} };
    } else if (hasMailbox === 'false') {
      where.mailboxes = { none: {} };
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where })
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
      ssoProvider: (user as any).ssoProvider,
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { companyId } = (request as any).user;

    const user = await prisma.user.findFirst({
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
    const aliases = await prisma.emailAlias.findMany({
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { domainId, localPart, quotaMb, displayName, setAsPrimary = true } = request.body as {
      domainId: string;
      localPart?: string;
      quotaMb?: number;
      displayName?: string;
      setAsPrimary?: boolean;
    };
    const { companyId, id: adminId } = (request as any).user;

    // Verify user belongs to company
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId }
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Verify domain belongs to company
    const domain = await prisma.emailDomain.findFirst({
      where: { id: domainId, companyId }
    });

    if (!domain) {
      return reply.status(404).send({ error: 'Domain not found' });
    }

    try {
      const result = await userMailboxLinkService.provisionMailboxForUser(userId, {
        domainId,
        localPart: localPart || user.email.split('@')[0],
        performedById: adminId,
      });

      if (!result.success || !result.mailbox) {
        return reply.status(400).send({ error: result.error || 'Failed to provision mailbox' });
      }

      // Log the action
      await prisma.mailboxAuditLog.create({
        data: {
          action: MailboxAuditAction.MAILBOX_CREATED,
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
    } catch (error: any) {
      return reply.status(400).send({ 
        error: error.message || 'Failed to provision mailbox' 
      });
    }
  });

  // Deprovision (delete) mailbox
  fastify.delete('/users/:userId/mailbox/:mailboxId', {
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, mailboxId } = request.params as { userId: string; mailboxId: string };
    const { companyId, id: adminId } = (request as any).user;

    // Verify ownership
    const mailbox = await prisma.mailbox.findFirst({
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
    await prisma.mailboxAuditLog.create({
      data: {
        action: MailboxAuditAction.MAILBOX_DELETED,
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
    await prisma.mailbox.delete({
      where: { id: mailboxId }
    });

    // If this was the primary mailbox, clear it
    await prisma.user.updateMany({
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { mailboxId } = request.body as { mailboxId: string };
    const { companyId } = (request as any).user;

    // Verify mailbox belongs to user
    const mailbox = await prisma.mailbox.findFirst({
      where: { 
        id: mailboxId, 
        userId,
        domain: { companyId }
      }
    });

    if (!mailbox) {
      return reply.status(404).send({ error: 'Mailbox not found' });
    }

    await prisma.user.update({
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { companyId } = (request as any).user;

    const user = await prisma.user.findFirst({
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
    
    await prisma.mailbox.updateMany({
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userIds, domainId, quotaMb } = request.body as {
      userIds: string[];
      domainId: string;
      quotaMb?: number;
    };
    const { companyId, id: adminId } = (request as any).user;

    if (!userIds || userIds.length === 0) {
      return reply.status(400).send({ error: 'No users specified' });
    }

    // Verify domain
    const domain = await prisma.emailDomain.findFirst({
      where: { id: domainId, companyId }
    });

    if (!domain) {
      return reply.status(404).send({ error: 'Domain not found' });
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findFirst({
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

        const result = await userMailboxLinkService.provisionMailboxForUser(userId, {
          domainId,
          localPart: user.email.split('@')[0],
          performedById: (request as any).user.id,
        });

        if (result.success && result.mailbox) {
          results.success.push({
            userId,
            userName: `${user.firstName} ${user.lastName}`,
            mailbox: result.mailbox.fullAddress,
          });
        } else {
          results.failed.push({ userId, error: result.error || 'Provisioning failed' });
        }

      } catch (error: any) {
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const { 
      userId, 
      mailboxId, 
      action,
      page = '1', 
      limit = '50' 
    } = request.query as { 
      userId?: string; 
      mailboxId?: string;
      action?: string;
      page?: string; 
      limit?: string;
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { companyId };
    if (userId) where.userId = userId;
    if (mailboxId) where.mailboxId = mailboxId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.mailboxAuditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mailboxAuditLog.count({ where })
    ]);

    // Fetch user info for logs that have performedById
    const performerIds = [...new Set(logs.map(l => l.performedById).filter(Boolean) as string[])];
    const performers = performerIds.length > 0 
      ? await prisma.user.findMany({
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;

    const domains = await prisma.emailDomain.findMany({
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
    preHandler: [(fastify as any).authenticate, adminOnly]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;

    const [
      totalUsers,
      activeUsers,
      usersWithMailbox,
      totalMailboxes,
      activeMailboxes,
      totalDomains,
      verifiedDomains,
      totalAliases,
      recentActivity
    ] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId, isActive: true } }),
      prisma.user.count({ where: { companyId, mailboxes: { some: {} } } }),
      prisma.mailbox.count({ where: { domain: { companyId } } }),
      prisma.mailbox.count({ where: { domain: { companyId }, isActive: true } }),
      prisma.emailDomain.count({ where: { companyId } }),
      prisma.emailDomain.count({ where: { companyId, isVerified: true } }),
      prisma.emailAlias.count({ where: { domain: { companyId } } }),
      prisma.mailboxAuditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    ]);

    // Fetch performer info for recent activity
    const performerIds = [...new Set(recentActivity.map(a => a.performedById).filter(Boolean) as string[])];
    const performers = performerIds.length > 0
      ? await prisma.user.findMany({
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
