---
name: enterprise-rbac
description: Enterprise Role-Based Access Control (RBAC) architecture, multi-tenant authorization, granular permission taxonomy, backend PEP/PDP guards in Fastify, and fluid React permission matrix UI. Use when designing, refactoring, or auditing roles, permissions, authorization middleware, or admin security panels.
---

# Enterprise Role-Based Access Control (RBAC)

## The Core Rule of Enterprise Authorization

> **Authorize against permissions in code; assign roles to users.**

Never hardcode role checks like `if (user.role === 'ADMIN')` across application routes or UI views. Roles are transient collections of permissions. By authorizing against discrete, granular permissions (`documents:delete`, `finance:invoice:approve`), role capabilities can be tuned in the database or permission matrix without modifying codebase logic or redeploying services.

---

## 1. Permission Taxonomy (NIST Standard)

Format: `<domain>:<resource>:<action>`

### Standard Application Modules:
- **Users & Identity**:
  - `users:read`: View team directory and profiles
  - `users:create`: Add new members to workspace
  - `users:update`: Edit member details and job titles
  - `users:delete`: Terminate member access
  - `users:roles:manage`: Assign or modify roles & permissions
  - `users:mailbox:manage`: Provision and link corporate mailboxes
- **Documents**:
  - `documents:read`: View shared organizational documents
  - `documents:create`: Generate new documents and letterheads
  - `documents:edit`: Modify document templates and content
  - `documents:delete`: Archive or remove documents
  - `documents:sign`: Affix corporate and executive e-signatures
- **Finance & Operations**:
  - `finance:invoices:read`: View VAT invoices and statements
  - `finance:invoices:manage`: Issue, edit, and void invoices
  - `finance:quotations:manage`: Create and send price quotations
  - `finance:job_cards:read`: View field service job cards
  - `finance:job_cards:manage`: Create, execute, and sign job cards
  - `finance:delivery_notes:manage`: Dispatch and verify goods delivery notes
- **Mail & Communications**:
  - `mail:read`: Access inbox and thread history
  - `mail:send`: Compose and dispatch emails
  - `mail:hosting:manage`: Configure domains, MX/SPF/DKIM/DMARC records
- **Administration & Security**:
  - `company:settings:read`: View company profile and coordinates
  - `company:settings:update`: Update KRA tax info, brand colors, bank details
  - `audit:logs:read`: Inspect security audit trail and access logs

---

## 2. Default System Roles & Hierarchy

1. **ADMIN (Enterprise Super-Administrator)**
   - Complete, unrestricted access (`*:*`). Full workspace governance, company banking/tax settings, domain hosting, and user role management.
2. **MANAGER (Operations & Finance Lead)**
   - Manages team members, clients, commercial documents (Invoices, Quotes, Delivery Notes, Job Cards), templates, and operational communications.
3. **STAFF (Field Engineer & Technician)**
   - Focused operational role: Service Job Cards, Goods Delivery Notes, viewing shared documents and executing their assigned tasks.
4. **FINANCE (Accountant & Billing Specialist)**
   - Specialized role: Full invoice generation, taxation, delivery note reconciliation, and quotations without administrative system settings access.
5. **AUDITOR (Read-Only Compliance)**
   - Read-only inspection across documents, financial logs, and audit trails without mutation privileges.

---

## 3. Fastify Backend Architecture (PEP / PDP Separation)

- **PEP (Policy Enforcement Point)**: Fastify preHandler hook `requirePermission(requiredPermission)` validates the user's computed permissions before executing route logic.
- **PDP (Policy Decision Point)**: Permission resolution engine resolves user role + custom permission overrides, respecting multi-tenant tenant isolation (`companyId`).
- **Security Defenses**:
  - **OWASP API1 (BOLA/IDOR)**: Always scope database queries by `companyId` (and `userId` where applicable).
  - **OWASP API5 (BFLA)**: Always enforce permission checks on mutation endpoints regardless of frontend state.
  - **Lean JWTs**: Store `id`, `companyId`, `role` in the JWT; resolve fine-grained permissions via memoized database query or Redis cache.

---

## 4. Frontend React Architecture & Micro-Interactions

- **Permission Context**: High-performance `PermissionProvider` evaluating `hasPermission(permission)`.
- **Declarative Gate**: `<Can perform="users:create" fallback={<DisabledTooltip />}>...</Can>`
- **Emil Kowalski Craft Standards**:
  - Tactile permission matrix with Apple-grade switches (`active:scale-95`).
  - Clear visual feedback on toggle: optimistic UI updates with background synchronization.
  - Real data persistence: every role modification or user assignment calls real backend APIs.
  - Responsive layout: fluid table for desktop, accessible cards and bottom-sheets for mobile viewports.
