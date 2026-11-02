import { UserRole } from '@prisma/client';
import { prisma } from '../index';

export interface PermissionDefinition {
  id: string;
  category: 'Identity & Access' | 'Documents & Signatures' | 'Finance & Operations' | 'Email & Hosting' | 'Company & Administration';
  label: string;
  description: string;
  riskLevel: 'standard' | 'elevated' | 'critical';
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // Identity & Access
  {
    id: 'users:read',
    category: 'Identity & Access',
    label: 'View Team Directory',
    description: 'View members, contact cards, and directory profiles',
    riskLevel: 'standard'
  },
  {
    id: 'users:create',
    category: 'Identity & Access',
    label: 'Add Team Members',
    description: 'Invite and create new team accounts in workspace',
    riskLevel: 'elevated'
  },
  {
    id: 'users:update',
    category: 'Identity & Access',
    label: 'Update Member Profiles',
    description: 'Edit member designations, details, and active status',
    riskLevel: 'elevated'
  },
  {
    id: 'users:delete',
    category: 'Identity & Access',
    label: 'Terminate Members',
    description: 'Deactivate and delete user accounts from workspace',
    riskLevel: 'critical'
  },
  {
    id: 'users:roles:manage',
    category: 'Identity & Access',
    label: 'Manage Roles & RBAC',
    description: 'Configure permission matrices and override user capabilities',
    riskLevel: 'critical'
  },
  {
    id: 'users:mailbox:manage',
    category: 'Identity & Access',
    label: 'Provision Corporate Mailboxes',
    description: 'Assign, create, and link custom domain mailboxes to users',
    riskLevel: 'elevated'
  },

  // Documents & Signatures
  {
    id: 'documents:read',
    category: 'Documents & Signatures',
    label: 'View Documents',
    description: 'Inspect shared company documents and contracts',
    riskLevel: 'standard'
  },
  {
    id: 'documents:create',
    category: 'Documents & Signatures',
    label: 'Create Documents',
    description: 'Generate new official documents and stationery',
    riskLevel: 'standard'
  },
  {
    id: 'documents:edit',
    category: 'Documents & Signatures',
    label: 'Edit Documents',
    description: 'Modify drafts, templates, and company agreements',
    riskLevel: 'elevated'
  },
  {
    id: 'documents:delete',
    category: 'Documents & Signatures',
    label: 'Delete Documents',
    description: 'Permanently remove documents and templates',
    riskLevel: 'critical'
  },
  {
    id: 'documents:sign',
    category: 'Documents & Signatures',
    label: 'Sign & Seal Documents',
    description: 'Apply corporate e-signature and official stamps to records',
    riskLevel: 'elevated'
  },

  // Finance & Operations
  {
    id: 'finance:invoices:read',
    category: 'Finance & Operations',
    label: 'View VAT Invoices',
    description: 'Review issued tax invoices, payment status, and totals',
    riskLevel: 'standard'
  },
  {
    id: 'finance:invoices:manage',
    category: 'Finance & Operations',
    label: 'Issue & Manage Invoices',
    description: 'Create, edit, send, and void 16% VAT commercial invoices',
    riskLevel: 'critical'
  },
  {
    id: 'finance:quotations:manage',
    category: 'Finance & Operations',
    label: 'Manage Quotations',
    description: 'Draft and dispatch commercial quotations and cost proposals',
    riskLevel: 'elevated'
  },
  {
    id: 'finance:job_cards:read',
    category: 'Finance & Operations',
    label: 'View Service Job Cards',
    description: 'Access field technician work records and job orders',
    riskLevel: 'standard'
  },
  {
    id: 'finance:job_cards:manage',
    category: 'Finance & Operations',
    label: 'Execute Service Job Cards',
    description: 'Create, update, and sign technical field service cards',
    riskLevel: 'standard'
  },
  {
    id: 'finance:delivery_notes:manage',
    category: 'Finance & Operations',
    label: 'Manage Goods Delivery Notes',
    description: 'Generate, issue, and inspect delivery and dispatch notes',
    riskLevel: 'standard'
  },

  // Email & Hosting
  {
    id: 'mail:read',
    category: 'Email & Hosting',
    label: 'Access Email Inbox',
    description: 'Read inbound corporate email messages and threads',
    riskLevel: 'standard'
  },
  {
    id: 'mail:send',
    category: 'Email & Hosting',
    label: 'Send Outbound Email',
    description: 'Compose and dispatch emails via corporate SMTP/Stalwart',
    riskLevel: 'standard'
  },
  {
    id: 'mail:hosting:manage',
    category: 'Email & Hosting',
    label: 'Manage Domains & DNS',
    description: 'Add domains, inspect MX/SPF/DKIM/DMARC records, and hosting',
    riskLevel: 'critical'
  },

  // Company & Administration
  {
    id: 'company:settings:read',
    category: 'Company & Administration',
    label: 'View Company Settings',
    description: 'Inspect organization tax PIN, banking, and coordinates',
    riskLevel: 'standard'
  },
  {
    id: 'company:settings:update',
    category: 'Company & Administration',
    label: 'Update Company Coordinates',
    description: 'Modify KRA PIN, bank accounts, logo, and brand colors',
    riskLevel: 'critical'
  },
  {
    id: 'audit:logs:read',
    category: 'Company & Administration',
    label: 'Inspect Security Audit Logs',
    description: 'Review administrative security audit trails and events',
    riskLevel: 'elevated'
  }
];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map(p => p.id);

// Baseline permissions by role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'], // Wildcard - unrestricted
  MANAGER: [
    'users:read',
    'users:create',
    'users:update',
    'users:mailbox:manage',
    'documents:read',
    'documents:create',
    'documents:edit',
    'documents:sign',
    'finance:invoices:read',
    'finance:invoices:manage',
    'finance:quotations:manage',
    'finance:job_cards:read',
    'finance:job_cards:manage',
    'finance:delivery_notes:manage',
    'mail:read',
    'mail:send',
    'company:settings:read',
    'audit:logs:read'
  ],
  STAFF: [
    'users:read',
    'documents:read',
    'documents:sign',
    'finance:job_cards:read',
    'finance:job_cards:manage',
    'finance:delivery_notes:manage',
    'mail:read',
    'mail:send'
  ],
  FINANCE: [
    'users:read',
    'documents:read',
    'finance:invoices:read',
    'finance:invoices:manage',
    'finance:quotations:manage',
    'finance:delivery_notes:manage',
    'finance:job_cards:read',
    'mail:read',
    'mail:send',
    'company:settings:read'
  ],
  AUDITOR: [
    'users:read',
    'documents:read',
    'finance:invoices:read',
    'finance:job_cards:read',
    'company:settings:read',
    'audit:logs:read'
  ]
};

// In-memory cache for fast authorization lookups
interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}
const permissionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export class RbacService {
  /**
   * Evaluate whether a list of permissions grants the required permission.
   * Supports wildcard '*' and resource-level wildcards 'prefix:*'
   */
  hasPermission(grantedPermissions: string[], required: string): boolean {
    if (!grantedPermissions || grantedPermissions.length === 0) return false;
    if (grantedPermissions.includes('*')) return true;
    if (grantedPermissions.includes(required)) return true;

    // Check namespace wildcard: e.g. 'finance:*' grants 'finance:invoices:read'
    const parts = required.split(':');
    if (parts.length > 1) {
      const namespaceWildcard = `${parts[0]}:*`;
      if (grantedPermissions.includes(namespaceWildcard)) return true;
    }

    return false;
  }

  /**
   * Resolve role base permissions for a given company (checks customized RoleSetting or falls back to default)
   */
  async getRolePermissions(role: UserRole, companyId: string): Promise<string[]> {
    try {
      const setting = await prisma.roleSetting.findUnique({
        where: {
          companyId_role: { companyId, role }
        }
      });
      if (setting && setting.permissions && setting.permissions.length > 0) {
        return setting.permissions;
      }
    } catch (err) {
      console.warn(`[RBAC] Failed to fetch custom role setting for ${role}:`, err);
    }
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get the complete Role-Permission Matrix for a company
   */
  async getMatrix(companyId: string): Promise<Record<UserRole, string[]>> {
    const roles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.STAFF,
      UserRole.FINANCE,
      UserRole.AUDITOR
    ];

    const customSettings = await prisma.roleSetting.findMany({
      where: { companyId }
    });

    const customMap = new Map<UserRole, string[]>();
    for (const s of customSettings) {
      customMap.set(s.role, s.permissions);
    }

    const matrix: any = {};
    for (const r of roles) {
      matrix[r] = customMap.get(r) || DEFAULT_ROLE_PERMISSIONS[r] || [];
    }
    return matrix;
  }

  /**
   * Update role permissions for a company
   */
  async updateRolePermissions(companyId: string, role: UserRole, permissions: string[]): Promise<string[]> {
    // Admin role always maintains wildcard
    if (role === UserRole.ADMIN && !permissions.includes('*')) {
      permissions = ['*', ...permissions];
    }

    const validPermissions = permissions.filter(p => p === '*' || ALL_PERMISSION_KEYS.includes(p));

    await prisma.roleSetting.upsert({
      where: {
        companyId_role: { companyId, role }
      },
      create: {
        companyId,
        role,
        permissions: validPermissions
      },
      update: {
        permissions: validPermissions
      }
    });

    // Invalidate cache
    this.invalidateCompanyCache(companyId);

    return validPermissions;
  }

  /**
   * Reset role permissions for a company back to system defaults
   */
  async resetRolePermissions(companyId: string, role: UserRole): Promise<string[]> {
    await prisma.roleSetting.deleteMany({
      where: { companyId, role }
    });
    this.invalidateCompanyCache(companyId);
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Resolve a user's total effective permissions (role base + customPermissions)
   */
  async getUserEffectivePermissions(user: { id: string; role: UserRole; companyId: string; customPermissions?: string[] }): Promise<string[]> {
    const cacheKey = `user:${user.id}`;
    const cached = permissionCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.permissions;
    }

    if (user.role === UserRole.ADMIN) {
      const perms = ['*'];
      permissionCache.set(cacheKey, { permissions: perms, expiresAt: now + CACHE_TTL_MS });
      return perms;
    }

    const basePermissions = await this.getRolePermissions(user.role, user.companyId);
    const userOverrides = user.customPermissions || [];

    // Union
    const combinedSet = new Set<string>([...basePermissions, ...userOverrides]);
    const effective = Array.from(combinedSet);

    permissionCache.set(cacheKey, { permissions: effective, expiresAt: now + CACHE_TTL_MS });
    return effective;
  }

  /**
   * Set custom permission overrides for a user
   */
  async setUserCustomPermissions(userId: string, companyId: string, customPermissions: string[]): Promise<string[]> {
    const valid = customPermissions.filter(p => p === '*' || ALL_PERMISSION_KEYS.includes(p));
    
    await prisma.user.update({
      where: { id: userId, companyId },
      data: { customPermissions: valid }
    });

    permissionCache.delete(`user:${userId}`);
    return valid;
  }

  invalidateUserCache(userId: string) {
    permissionCache.delete(`user:${userId}`);
  }

  invalidateCompanyCache(companyId: string) {
    // Clear in-memory cache
    permissionCache.clear();
  }
}

export const rbacService = new RbacService();
export default rbacService;
