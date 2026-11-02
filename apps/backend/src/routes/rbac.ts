import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';
import { prisma } from '../index';
import rbacService, { PERMISSION_CATALOG, ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS } from '../services/rbacService';

// Middleware to ensure user has admin role or users:roles:manage permission
const requireRbacManage = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = (request as any).user;
  if (!user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  if (user.role === UserRole.ADMIN) {
    return; // Admin always permitted
  }

  const effective = await rbacService.getUserEffectivePermissions(user);
  if (!rbacService.hasPermission(effective, 'users:roles:manage')) {
    return reply.status(403).send({ 
      error: 'Forbidden', 
      message: "Requires 'users:roles:manage' permission" 
    });
  }
};

export default async function rbacRoutes(fastify: FastifyInstance) {
  // Hook all routes to require authentication
  fastify.addHook('preHandler', (fastify as any).authenticate);

  /**
   * GET /api/rbac/permissions
   * Returns full catalog of system permissions with categories and metadata
   */
  fastify.get('/permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      permissions: PERMISSION_CATALOG,
      total: PERMISSION_CATALOG.length,
      categories: [
        'Identity & Access',
        'Documents & Signatures',
        'Finance & Operations',
        'Email & Hosting',
        'Company & Administration'
      ]
    };
  });

  /**
   * GET /api/rbac/matrix
   * Returns role-permission matrix for company
   */
  fastify.get('/matrix', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const matrix = await rbacService.getMatrix(companyId);
    
    return {
      matrix,
      defaults: DEFAULT_ROLE_PERMISSIONS,
      roles: [
        { id: 'ADMIN', label: 'Administrator', description: 'Full access to all workspace systems & finances', color: 'purple' },
        { id: 'MANAGER', label: 'Operations Lead', description: 'Documents, finance, team directory, and operations', color: 'blue' },
        { id: 'STAFF', label: 'Field Technician', description: 'Field service job cards, delivery notes, and work emails', color: 'slate' },
        { id: 'FINANCE', label: 'Finance & Billing', description: 'Tax invoices, quotations, delivery notes, and billing', color: 'emerald' },
        { id: 'AUDITOR', label: 'Auditor & Compliance', description: 'Read-only audit trails, documents, and financial records', color: 'amber' }
      ]
    };
  });

  /**
   * PUT /api/rbac/matrix
   * Update permissions for a specific role
   */
  fastify.put('/matrix', {
    preHandler: [requireRbacManage]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const { role, permissions } = request.body as { role: UserRole; permissions: string[] };

    if (!role || !permissions || !Array.isArray(permissions)) {
      return reply.status(400).send({ error: 'Valid role and permissions array are required' });
    }

    if (!Object.values(UserRole).includes(role)) {
      return reply.status(400).send({ error: `Invalid role: ${role}` });
    }

    const updated = await rbacService.updateRolePermissions(companyId, role, permissions);

    return {
      success: true,
      role,
      permissions: updated
    };
  });

  /**
   * POST /api/rbac/matrix/reset
   * Reset role permissions back to default
   */
  fastify.post('/matrix/reset', {
    preHandler: [requireRbacManage]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const { role } = request.body as { role: UserRole };

    if (!role || !Object.values(UserRole).includes(role)) {
      return reply.status(400).send({ error: `Invalid role: ${role}` });
    }

    const reset = await rbacService.resetRolePermissions(companyId, role);

    return {
      success: true,
      role,
      permissions: reset
    };
  });

  /**
   * GET /api/rbac/users/:id/permissions
   * Fetch effective and custom permissions for a user
   */
  fastify.get('/users/:id/permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const { id } = request.params as { id: string };

    const targetUser = await prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        customPermissions: true
      }
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const effective = await rbacService.getUserEffectivePermissions({
      id: targetUser.id,
      role: targetUser.role,
      companyId,
      customPermissions: targetUser.customPermissions
    });

    const roleBase = await rbacService.getRolePermissions(targetUser.role, companyId);

    return {
      userId: targetUser.id,
      role: targetUser.role,
      roleBasePermissions: roleBase,
      customPermissions: targetUser.customPermissions || [],
      effectivePermissions: effective
    };
  });

  /**
   * PUT /api/rbac/users/:id/permissions
   * Set custom permission overrides for a user
   */
  fastify.put('/users/:id/permissions', {
    preHandler: [requireRbacManage]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = (request as any).user;
    const { id } = request.params as { id: string };
    const { customPermissions } = request.body as { customPermissions: string[] };

    if (!Array.isArray(customPermissions)) {
      return reply.status(400).send({ error: 'customPermissions must be an array of permission keys' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id, companyId }
    });

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const updated = await rbacService.setUserCustomPermissions(id, companyId, customPermissions);

    const effective = await rbacService.getUserEffectivePermissions({
      id: targetUser.id,
      role: targetUser.role,
      companyId,
      customPermissions: updated
    });

    return {
      success: true,
      userId: id,
      customPermissions: updated,
      effectivePermissions: effective
    };
  });

  /**
   * GET /api/rbac/my-permissions
   * Current user's permissions
   */
  fastify.get('/my-permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const effective = await rbacService.getUserEffectivePermissions(user);

    return {
      userId: user.id,
      role: user.role,
      permissions: effective
    };
  });
}
