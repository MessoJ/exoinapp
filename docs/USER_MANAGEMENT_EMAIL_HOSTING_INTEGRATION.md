# User Management & Email Hosting Integration Guide

## Executive Summary

This document provides comprehensive research and implementation guidance for integrating user management with email hosting services in the ExoinApp platform. It covers self-hosted solutions, cloud-based APIs, authentication flows, and practical implementation strategies.

---

## Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Email Hosting Architecture Options](#email-hosting-architecture-options)
3. [Self-Hosted Solutions](#self-hosted-solutions)
4. [Cloud-Based Email APIs](#cloud-based-email-apis)
5. [User Management Integration Patterns](#user-management-integration-patterns)
6. [Authentication & SSO](#authentication--sso)
7. [Mailbox Provisioning Flows](#mailbox-provisioning-flows)
8. [Current ExoinApp Implementation Analysis](#current-exoinapp-implementation-analysis)
9. [Recommended Integration Strategy](#recommended-integration-strategy)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Security Considerations](#security-considerations)
12. [Appendix: API References](#appendix-api-references)

---

## 1. Overview & Goals

### Primary Objectives

1. **Unified User Identity**: Single user account manages both app access and email mailbox
2. **Automated Provisioning**: When a user is created, their mailbox is automatically provisioned
3. **Centralized Management**: Admins manage users and email settings from one interface
4. **Seamless Authentication**: Users authenticate once to access both app and email
5. **Domain Management**: Multi-tenant support with per-company email domains

### Key Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      ExoinApp Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │    Users     │◄──►│   Mailboxes  │◄──►│   Domains    │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│          │                   │                   │              │
│          ▼                   ▼                   ▼              │
│   ┌──────────────────────────────────────────────────────┐     │
│   │             Email Hosting Service                     │     │
│   │  (Self-Hosted: Mailcow/Mailu or Cloud: Google/M365)  │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Email Hosting Architecture Options

### Option A: Self-Hosted Email Server

| Aspect | Description |
|--------|-------------|
| **Control** | Full control over data and infrastructure |
| **Cost** | Lower recurring costs, higher setup/maintenance |
| **Scalability** | Limited by infrastructure |
| **Deliverability** | Requires careful IP reputation management |
| **Best For** | Privacy-focused, large organizations |

### Option B: Cloud Email Service (Google/Microsoft 365)

| Aspect | Description |
|--------|-------------|
| **Control** | Limited, API-based management |
| **Cost** | Per-user subscription (higher recurring) |
| **Scalability** | Unlimited |
| **Deliverability** | Excellent reputation and infrastructure |
| **Best For** | Enterprises, compliance requirements |

### Option C: Hybrid Approach

| Aspect | Description |
|--------|-------------|
| **Control** | Mix of self-hosted and cloud |
| **Cost** | Moderate |
| **Use Case** | Self-host primary mail, cloud for specific needs |
| **Complexity** | Higher integration complexity |

---

## 3. Self-Hosted Solutions

### 3.1 Mailcow: Dockerized

**Overview**: Full-featured, Docker-based mail server suite with comprehensive API.

#### Key Components
- **Postfix**: MTA (Mail Transfer Agent)
- **Dovecot**: IMAP/POP3 server with full-text search
- **SOGo**: Webmail and CalDAV/CardDAV
- **Rspamd**: Spam filtering
- **ClamAV**: Antivirus (optional)
- **MariaDB**: Database for user information

#### API Capabilities
```bash
# Mailcow API Examples

# Create mailbox
POST /api/v1/add/mailbox
{
  "local_part": "john",
  "domain": "example.com",
  "name": "John Doe",
  "password": "SecurePassword123!",
  "quota": "5120",  // MB
  "active": "1"
}

# Create alias
POST /api/v1/add/alias
{
  "address": "sales@example.com",
  "goto": "john@example.com,jane@example.com",
  "active": "1"
}

# Add domain
POST /api/v1/add/domain
{
  "domain": "example.com",
  "description": "Example Company",
  "maxquota": "10240",  // MB per mailbox
  "quota": "102400"     // Total MB for domain
}
```

#### Integration with LDAP/OAuth
Mailcow supports:
- **LDAP/AD**: Sync users from Active Directory
- **Keycloak**: OpenID Connect SSO
- **Generic OIDC**: Any OAuth2/OIDC provider

#### Docker Compose Integration
```yaml
# Add to existing docker-compose.yml
services:
  mailcow:
    image: mailcow/mailcow-dockerized
    volumes:
      - ./mailcow.conf:/opt/mailcow-dockerized/mailcow.conf
    environment:
      - MAILCOW_HOSTNAME=mail.example.com
      - DBNAME=mailcow
      - DBUSER=mailcow
    ports:
      - "25:25"      # SMTP
      - "465:465"    # SMTPS
      - "587:587"    # Submission
      - "993:993"    # IMAPS
    networks:
      - exoin-network
```

### 3.2 Mailu

**Overview**: Lightweight, Kubernetes-ready mail server with RESTful API.

#### Key Features
- Simpler architecture than Mailcow
- Native Kubernetes support
- Built-in admin API with SwaggerUI
- Lower resource requirements

#### API Examples
```bash
# Mailu API Base: https://mail.example.com/api/v1

# Create domain
POST /domain
{
  "name": "example.com",
  "max_users": 50,
  "max_aliases": 100,
  "signup_enabled": false
}

# Create user (mailbox)
POST /user
{
  "localpart": "john",
  "domain": "example.com",
  "password": "SecurePassword123!",
  "display_name": "John Doe",
  "quota_bytes": 5368709120  // 5GB
}

# Create alias
POST /alias
{
  "localpart": "info",
  "domain": "example.com",
  "destination": ["john@example.com"]
}
```

### 3.3 iRedMail

**Overview**: Enterprise-grade mail server with admin panel (iRedAdmin-Pro).

#### Features
- SQL (MySQL/PostgreSQL), LDAP, or OpenLDAP backend
- RESTful API via iRedAdmin-Pro
- SOGo integration for webmail
- Per-user/domain settings

#### RESTful API (iRedAdmin-Pro)
```bash
# API Base: https://mail.example.com/api

# Create user
POST /mail/user/info
{
  "domain": "example.com",
  "username": "john",
  "password": "SecurePassword123!",
  "quota": 5120,  // MB
  "name": "John Doe"
}

# Create domain
POST /mail/domain
{
  "domain": "example.com",
  "max_user_quota": 10240,
  "max_alias_quota": 100
}
```

---

## 4. Cloud-Based Email APIs

### 4.1 Google Workspace Admin SDK

**Use Case**: Organizations using Google Workspace

#### Directory API - User Management
```javascript
// Create user with mailbox (auto-provisioned)
const user = await admin.users.insert({
  requestBody: {
    primaryEmail: 'john@example.com',
    name: {
      givenName: 'John',
      familyName: 'Doe'
    },
    password: 'temporaryPassword123!',
    changePasswordAtNextLogin: true,
    suspended: false,
    orgUnitPath: '/Engineering'
  }
});

// Update user
await admin.users.update({
  userKey: 'john@example.com',
  requestBody: {
    name: { givenName: 'Jonathan' },
    isMailboxSetup: true
  }
});

// Delete user
await admin.users.delete({
  userKey: 'john@example.com'
});
```

#### OAuth2 Scopes Required
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.domain',
  'https://www.googleapis.com/auth/admin.directory.group'
];
```

#### Key Endpoints
| Endpoint | Purpose |
|----------|---------|
| `POST /admin/directory/v1/users` | Create user |
| `PUT /admin/directory/v1/users/{userKey}` | Update user |
| `DELETE /admin/directory/v1/users/{userKey}` | Delete user |
| `GET /admin/directory/v1/users` | List users |
| `POST /admin/directory/v1/users/{userKey}/makeAdmin` | Make admin |

### 4.2 Microsoft Graph API (Microsoft 365)

**Use Case**: Organizations using Microsoft 365

#### User & Mailbox Management
```javascript
// Create user (mailbox auto-provisioned with license)
const user = await graphClient.api('/users').post({
  accountEnabled: true,
  displayName: 'John Doe',
  mailNickname: 'john',
  userPrincipalName: 'john@example.com',
  passwordProfile: {
    forceChangePasswordNextSignIn: true,
    password: 'TempPassword123!'
  }
});

// Assign Microsoft 365 license
await graphClient.api(`/users/${user.id}/assignLicense`).post({
  addLicenses: [
    { skuId: 'M365_BUSINESS_BASIC_SKU_ID' }
  ],
  removeLicenses: []
});

// Get mailbox settings
const settings = await graphClient.api(`/users/${user.id}/mailboxSettings`).get();

// Update mailbox settings
await graphClient.api(`/users/${user.id}/mailboxSettings`).patch({
  automaticRepliesSetting: {
    status: 'scheduled',
    scheduledStartDateTime: { ... },
    scheduledEndDateTime: { ... },
    internalReplyMessage: 'Out of office message...',
    externalReplyMessage: 'External message...'
  }
});
```

#### Permissions Required
```json
{
  "permissions": [
    "User.ReadWrite.All",
    "Directory.ReadWrite.All", 
    "Mail.ReadWrite",
    "MailboxSettings.ReadWrite"
  ]
}
```

### 4.3 Comparison: Google vs Microsoft

| Feature | Google Workspace | Microsoft 365 |
|---------|------------------|---------------|
| API Style | REST + Client Libraries | Microsoft Graph |
| User Provisioning | Fast (seconds) | Minutes for mailbox |
| Licensing | Per-user + domain | Per-user |
| SSO Integration | OAuth2/SAML | OAuth2/SAML/AD |
| Admin SDK | Comprehensive | Graph API unified |
| Pricing | From $6/user/month | From $6/user/month |

---

## 5. User Management Integration Patterns

### 5.1 Pattern: Synchronized User Model

```typescript
// When app user is created, mailbox is provisioned
interface UserMailboxSync {
  // App user creation triggers mailbox creation
  async createUser(userData: CreateUserDTO): Promise<User> {
    // 1. Create user in app database
    const user = await prisma.user.create({ data: userData });
    
    // 2. Create mailbox in email system
    const mailbox = await emailHostingService.createMailbox({
      email: `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@${domain}`,
      displayName: `${user.firstName} ${user.lastName}`,
      password: generateSecurePassword(),
      quotaMb: 5120
    });
    
    // 3. Link user to mailbox
    await prisma.user.update({
      where: { id: user.id },
      data: { mailboxId: mailbox.id }
    });
    
    // 4. Send welcome email with credentials
    await emailService.sendWelcomeEmail(user.email, mailbox.email);
    
    return user;
  }
}
```

### 5.2 Pattern: On-Demand Mailbox Creation

```typescript
// Mailbox created only when user requests it
interface OnDemandMailbox {
  async requestMailbox(userId: string): Promise<Mailbox> {
    const user = await prisma.user.findUnique({ where: { id: userId }});
    const company = await prisma.company.findUnique({ where: { id: user.companyId }});
    
    // Check if company has email domain
    const domain = await prisma.emailDomain.findFirst({
      where: { companyId: company.id, isVerified: true }
    });
    
    if (!domain) {
      throw new Error('Company has no verified email domain');
    }
    
    // Create mailbox
    const mailbox = await emailHostingService.createMailbox({
      domainId: domain.id,
      localPart: generateLocalPart(user),
      displayName: user.fullName,
      userId: user.id
    });
    
    return mailbox;
  }
}
```

### 5.3 Pattern: LDAP/AD Synchronization

```typescript
// Sync users from Active Directory
interface LDAPSync {
  async syncFromLDAP(): Promise<SyncResult> {
    const ldapUsers = await ldapService.getUsers();
    
    for (const ldapUser of ldapUsers) {
      // Check if user exists
      let user = await prisma.user.findFirst({
        where: { email: ldapUser.mail }
      });
      
      if (!user) {
        // Create user and mailbox
        user = await this.createUser({
          email: ldapUser.mail,
          firstName: ldapUser.givenName,
          lastName: ldapUser.sn,
          externalId: ldapUser.distinguishedName
        });
      } else {
        // Update user attributes
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: ldapUser.givenName,
            lastName: ldapUser.sn
          }
        });
      }
    }
    
    return { synced: ldapUsers.length };
  }
}
```

---

## 6. Authentication & SSO

### 6.1 Single Sign-On (SSO) Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ExoinApp  │     │     IdP     │     │ Mail Server │
│   (Frontend)│     │  (Keycloak) │     │  (Mailcow)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Login Request │                   │
       ├──────────────────►│                   │
       │                   │                   │
       │  2. Authenticate  │                   │
       │◄──────────────────┤                   │
       │    (JWT Token)    │                   │
       │                   │                   │
       │  3. Access API    │                   │
       ├───────────────────┼──────────────────►│
       │   (Bearer Token)  │                   │
       │                   │                   │
       │  4. Validate Token│                   │
       │                   │◄──────────────────┤
       │                   ├──────────────────►│
       │                   │   (Valid/Invalid) │
       │                   │                   │
       │  5. Mail Access   │                   │
       │◄──────────────────┼───────────────────┤
       │                   │                   │
```

### 6.2 OAuth2/OIDC Integration

```typescript
// Keycloak/OIDC configuration for email integration
const oidcConfig = {
  issuer: 'https://auth.exoinafrica.com/realms/exoin',
  clientId: 'exoin-mail',
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  redirectUri: 'https://mail.exoinafrica.com/callback',
  scopes: ['openid', 'email', 'profile', 'mail:read', 'mail:write']
};

// Token validation middleware
async function validateMailAccess(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = await verifyToken(token, oidcConfig);
    
    // Check mail access scope
    if (!decoded.scopes.includes('mail:read')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Attach user and mailbox info
    req.user = decoded;
    req.mailbox = await getMailboxForUser(decoded.sub);
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 6.3 IMAP/SMTP OAuth2 (XOAUTH2)

```typescript
// Enable OAuth2 authentication for IMAP/SMTP
const imapConfig = {
  user: 'john@example.com',
  xoauth2: generateXOAuth2Token({
    user: 'john@example.com',
    accessToken: oauthAccessToken
  }),
  host: 'mail.example.com',
  port: 993,
  tls: true
};

function generateXOAuth2Token(params: { user: string; accessToken: string }): string {
  const authString = `user=${params.user}\x01auth=Bearer ${params.accessToken}\x01\x01`;
  return Buffer.from(authString).toString('base64');
}
```

---

## 7. Mailbox Provisioning Flows

### 7.1 User Registration with Automatic Mailbox

```typescript
// Complete user registration flow
async function registerUserWithMailbox(
  registrationData: UserRegistrationDTO
): Promise<{ user: User; mailbox: Mailbox; credentials: MailCredentials }> {
  
  const transaction = await prisma.$transaction(async (tx) => {
    // 1. Create company if new
    let company = await tx.company.findUnique({
      where: { domain: registrationData.companyDomain }
    });
    
    if (!company) {
      company = await tx.company.create({
        data: {
          name: registrationData.companyName,
          domain: registrationData.companyDomain,
          // ... other fields
        }
      });
      
      // Create email domain for company
      await emailHostingService.createEmailDomain(
        registrationData.companyDomain,
        company.id
      );
    }
    
    // 2. Create user
    const password = generateSecurePassword();
    const user = await tx.user.create({
      data: {
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        passwordHash: await hashPassword(password),
        companyId: company.id
      }
    });
    
    // 3. Get verified domain
    const domain = await tx.emailDomain.findFirst({
      where: { companyId: company.id, isVerified: true }
    });
    
    let mailbox = null;
    let mailCredentials = null;
    
    if (domain) {
      // 4. Create mailbox
      const mailPassword = generateSecurePassword();
      const localPart = `${registrationData.firstName.toLowerCase()}.${registrationData.lastName.toLowerCase()}`;
      
      mailbox = await emailHostingService.createMailbox(
        domain.id,
        localPart,
        mailPassword,
        {
          displayName: `${registrationData.firstName} ${registrationData.lastName}`,
          quotaMb: 5120,
          userId: user.id
        }
      );
      
      mailCredentials = {
        email: `${localPart}@${domain.domain}`,
        password: mailPassword,
        imapServer: `mail.${domain.domain}`,
        smtpServer: `mail.${domain.domain}`
      };
      
      // Update user with mail password (encrypted)
      await tx.user.update({
        where: { id: user.id },
        data: { mailPassword: await encryptPassword(mailPassword) }
      });
    }
    
    return { user, mailbox, mailCredentials };
  });
  
  // 5. Send welcome emails
  await sendWelcomeEmails(transaction);
  
  return transaction;
}
```

### 7.2 Bulk User Import with Mailbox Creation

```typescript
// CSV import flow
async function importUsersFromCSV(
  file: Express.Multer.File,
  companyId: string,
  options: {
    createMailboxes: boolean;
    defaultQuotaMb: number;
    sendWelcomeEmail: boolean;
  }
): Promise<ImportResult> {
  const records = await parseCSV(file);
  const results: ImportResult = {
    total: records.length,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  const domain = await prisma.emailDomain.findFirst({
    where: { companyId, isVerified: true }
  });
  
  for (const record of records) {
    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: record.email,
          firstName: record.firstName,
          lastName: record.lastName,
          passwordHash: await hashPassword(generateTempPassword()),
          companyId
        }
      });
      
      // Create mailbox if enabled and domain exists
      if (options.createMailboxes && domain) {
        const mailPassword = generateSecurePassword();
        await emailHostingService.createMailbox(
          domain.id,
          record.localPart || generateLocalPart(record),
          mailPassword,
          {
            displayName: `${record.firstName} ${record.lastName}`,
            quotaMb: options.defaultQuotaMb,
            userId: user.id
          }
        );
        
        if (options.sendWelcomeEmail) {
          await sendMailCredentials(user.email, mailPassword);
        }
      }
      
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: record._rowNumber,
        email: record.email,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### 7.3 User Lifecycle Events

```typescript
// Event-driven mailbox lifecycle
class MailboxLifecycleService {
  
  // When user is created
  @OnEvent('user.created')
  async onUserCreated(event: UserCreatedEvent) {
    if (event.autoCreateMailbox) {
      await this.createMailboxForUser(event.userId);
    }
  }
  
  // When user is deactivated
  @OnEvent('user.deactivated')
  async onUserDeactivated(event: UserDeactivatedEvent) {
    const mailbox = await prisma.mailbox.findFirst({
      where: { userId: event.userId }
    });
    
    if (mailbox) {
      await prisma.mailbox.update({
        where: { id: mailbox.id },
        data: { isActive: false }
      });
    }
  }
  
  // When user is deleted
  @OnEvent('user.deleted')
  async onUserDeleted(event: UserDeletedEvent) {
    const mailbox = await prisma.mailbox.findFirst({
      where: { userId: event.userId }
    });
    
    if (mailbox && event.deleteMailbox) {
      // Archive mailbox data first
      await this.archiveMailboxData(mailbox.id);
      
      // Then delete
      await emailHostingService.deleteMailbox(mailbox.id);
    }
  }
  
  // When user's name changes
  @OnEvent('user.updated')
  async onUserUpdated(event: UserUpdatedEvent) {
    if (event.changes.includes('firstName') || event.changes.includes('lastName')) {
      const mailbox = await prisma.mailbox.findFirst({
        where: { userId: event.userId }
      });
      
      if (mailbox) {
        await prisma.mailbox.update({
          where: { id: mailbox.id },
          data: {
            displayName: `${event.user.firstName} ${event.user.lastName}`
          }
        });
      }
    }
  }
}
```

---

## 8. Current ExoinApp Implementation Analysis

### 8.1 Existing Schema Structure

Based on the current Prisma schema, ExoinApp already has a solid foundation:

**User Model**
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  mailPassword  String?   // Already exists for mail credentials
  
  // Email signature settings already integrated
  signatureEnabled   Boolean   @default(false)
  signatureStyle     String    @default("executive")
  
  // 2FA already implemented
  totpSecret         String?
  totpEnabled        Boolean   @default(false)
  
  companyId     String
  company       Company   @relation(...)
}
```

**Email Hosting Models** (Already implemented)
```prisma
model EmailDomain { ... }
model Mailbox { 
  userId String?  // Link to app user
  ...
}
model EmailAlias { ... }
model DomainDNS { ... }
```

### 8.2 Gap Analysis

| Feature | Current Status | Required Action |
|---------|----------------|-----------------|
| User-Mailbox Link | ✅ `userId` field exists | Enforce on creation |
| Auto-Provisioning | ❌ Not implemented | Add event handlers |
| SSO/OIDC | ❌ Not implemented | Add OAuth2 flow |
| Password Sync | ⚠️ Separate passwords | Implement sync or SSO |
| IMAP/SMTP Auth | ⚠️ Basic auth only | Add XOAUTH2 support |
| Bulk Import | ❌ Not implemented | Add CSV import |

### 8.3 Recommended Schema Updates

```prisma
// Additions to User model
model User {
  // ... existing fields
  
  // Enhanced email integration
  primaryMailboxId   String?
  primaryMailbox     Mailbox?    @relation("PrimaryMailbox", fields: [primaryMailboxId], references: [id])
  
  // SSO fields
  ssoProvider        String?     // 'google', 'microsoft', 'keycloak'
  ssoExternalId      String?     // External provider user ID
  lastSsoLogin       DateTime?
  
  @@index([ssoProvider, ssoExternalId])
}

// Additions to Mailbox model
model Mailbox {
  // ... existing fields
  
  // Owner user (reverse of User.primaryMailbox)
  ownerUser          User?       @relation("PrimaryMailbox")
  
  // OAuth tokens for API access
  oauthAccessToken   String?
  oauthRefreshToken  String?
  oauthExpiresAt     DateTime?
}
```

---

## 9. Recommended Integration Strategy

### 9.1 Phase 1: Strengthen User-Mailbox Link (Week 1-2)

**Goal**: Ensure every user can have a linked mailbox

```typescript
// Service: UserMailboxLinkService

export async function linkUserToMailbox(
  userId: string, 
  mailboxId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { primaryMailboxId: mailboxId }
    }),
    prisma.mailbox.update({
      where: { id: mailboxId },
      data: { userId }
    })
  ]);
}

export async function createLinkedMailbox(
  userId: string,
  domainId: string,
  options?: CreateMailboxOptions
): Promise<Mailbox> {
  const user = await prisma.user.findUnique({ where: { id: userId }});
  
  const localPart = generateLocalPart(user);
  const password = generateSecurePassword();
  
  const mailbox = await emailHostingService.createMailbox(
    domainId,
    localPart,
    password,
    {
      displayName: `${user.firstName} ${user.lastName}`,
      userId,
      ...options
    }
  );
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      primaryMailboxId: mailbox.id,
      mailPassword: await encryptPassword(password)
    }
  });
  
  return mailbox;
}
```

### 9.2 Phase 2: Auto-Provisioning (Week 3-4)

**Goal**: Automatically create mailboxes when users are created

```typescript
// Middleware: Auto-provision mailbox on user creation

fastify.addHook('onSend', async (request, reply, payload) => {
  if (request.routerPath === '/api/users' && request.method === 'POST') {
    const response = JSON.parse(payload as string);
    
    if (reply.statusCode === 201 && response.user) {
      // Queue mailbox creation
      await jobQueue.add('provision-mailbox', {
        userId: response.user.id,
        companyId: response.user.companyId
      });
    }
  }
});

// Background job
async function provisionMailbox(job: Job) {
  const { userId, companyId } = job.data;
  
  const domain = await prisma.emailDomain.findFirst({
    where: { companyId, isVerified: true }
  });
  
  if (domain) {
    await createLinkedMailbox(userId, domain.id);
    
    // Send credentials email
    await notifyUserOfMailbox(userId);
  }
}
```

### 9.3 Phase 3: SSO Integration (Week 5-8)

**Goal**: Single authentication for app and mail access

```typescript
// OAuth2 strategy for email access

// routes/auth.ts
fastify.get('/auth/sso/mail', async (request, reply) => {
  const authUrl = buildOAuthUrl({
    provider: 'keycloak',
    scopes: ['openid', 'email', 'profile', 'mail:access'],
    redirectUri: `${config.baseUrl}/auth/sso/callback`
  });
  
  return reply.redirect(authUrl);
});

fastify.get('/auth/sso/callback', async (request, reply) => {
  const { code, state } = request.query;
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  
  // Verify and decode token
  const userInfo = await verifyToken(tokens.id_token);
  
  // Find or create user
  let user = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: userInfo.email },
        { ssoExternalId: userInfo.sub }
      ]
    }
  });
  
  if (!user) {
    // Auto-create user from SSO
    user = await createUserFromSSO(userInfo);
  }
  
  // Update SSO tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ssoProvider: 'keycloak',
      ssoExternalId: userInfo.sub,
      lastSsoLogin: new Date()
    }
  });
  
  // Generate app session
  const sessionToken = await createSession(user);
  
  return reply.redirect(`/mail?token=${sessionToken}`);
});
```

### 9.4 Phase 4: Admin Dashboard (Week 9-12)

**Goal**: Unified user and mailbox management interface

```typescript
// Admin API endpoints

// GET /api/admin/users-with-mailboxes
fastify.get('/admin/users-with-mailboxes', async (request) => {
  return prisma.user.findMany({
    where: { companyId: request.user.companyId },
    include: {
      primaryMailbox: {
        include: {
          domain: { select: { domain: true }}
        }
      }
    }
  });
});

// POST /api/admin/provision-mailbox/:userId
fastify.post('/admin/provision-mailbox/:userId', async (request) => {
  const { userId } = request.params;
  const { domainId, localPart, quotaMb } = request.body;
  
  return createLinkedMailbox(userId, domainId, { localPart, quotaMb });
});

// PUT /api/admin/sync-user-mailbox/:userId
fastify.put('/admin/sync-user-mailbox/:userId', async (request) => {
  const user = await prisma.user.findUnique({
    where: { id: request.params.userId },
    include: { primaryMailbox: true }
  });
  
  if (!user.primaryMailbox) {
    throw new Error('User has no mailbox');
  }
  
  // Sync display name and signature
  await prisma.mailbox.update({
    where: { id: user.primaryMailbox.id },
    data: {
      displayName: `${user.firstName} ${user.lastName}`,
      signatureHtml: user.signatureEnabled ? generateSignatureHtml(user) : null,
      signatureText: user.signatureEnabled ? generateSignatureText(user) : null
    }
  });
  
  return { synced: true };
});
```

---

## 10. Implementation Roadmap

### Timeline Overview

```
Week 1-2:   Schema Updates & User-Mailbox Linking
Week 3-4:   Auto-Provisioning Implementation
Week 5-6:   OAuth2/OIDC Foundation
Week 7-8:   SSO Integration & XOAUTH2
Week 9-10:  Admin Dashboard Development
Week 11-12: Testing & Documentation
```

### Detailed Tasks

#### Week 1-2: Schema & Linking
- [ ] Add `primaryMailboxId` to User schema
- [ ] Create migration
- [ ] Implement `UserMailboxLinkService`
- [ ] Add API endpoints for linking
- [ ] Write unit tests

#### Week 3-4: Auto-Provisioning
- [ ] Create BullMQ job for mailbox provisioning
- [ ] Add user creation hook
- [ ] Implement email credentials notification
- [ ] Add admin toggle for auto-provisioning
- [ ] Handle edge cases (no verified domain, etc.)

#### Week 5-6: OAuth2 Foundation
- [ ] Set up Keycloak realm and client
- [ ] Implement OAuth2 routes
- [ ] Create token storage mechanism
- [ ] Add refresh token handling

#### Week 7-8: SSO & XOAUTH2
- [ ] Implement XOAUTH2 for IMAP/SMTP
- [ ] Add SSO login flow
- [ ] Create user auto-creation from SSO
- [ ] Test with different providers

#### Week 9-10: Admin Dashboard
- [ ] Build user management UI
- [ ] Add mailbox provisioning UI
- [ ] Create bulk import feature
- [ ] Implement sync functionality

#### Week 11-12: Testing & Docs
- [ ] Integration testing
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation completion

---

## 11. Security Considerations

### 11.1 Password Storage

```typescript
// NEVER store plain text passwords
// Use strong encryption for mail credentials

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.MAIL_ENCRYPTION_KEY!, 'hex');

export function encryptMailPassword(password: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptMailPassword(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 11.2 OAuth Token Security

```typescript
// Secure token storage and rotation
interface TokenStore {
  storeTokens(userId: string, tokens: OAuthTokens): Promise<void>;
  getTokens(userId: string): Promise<OAuthTokens | null>;
  refreshIfNeeded(userId: string): Promise<OAuthTokens>;
  revokeTokens(userId: string): Promise<void>;
}

class SecureTokenStore implements TokenStore {
  async storeTokens(userId: string, tokens: OAuthTokens): Promise<void> {
    // Encrypt refresh token before storage
    const encryptedRefresh = encrypt(tokens.refreshToken);
    
    await prisma.mailbox.update({
      where: { userId },
      data: {
        oauthAccessToken: tokens.accessToken,
        oauthRefreshToken: encryptedRefresh,
        oauthExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
      }
    });
  }
  
  async refreshIfNeeded(userId: string): Promise<OAuthTokens> {
    const mailbox = await prisma.mailbox.findUnique({ where: { userId }});
    
    if (!mailbox.oauthExpiresAt || mailbox.oauthExpiresAt < new Date()) {
      // Token expired, refresh it
      const newTokens = await refreshToken(decrypt(mailbox.oauthRefreshToken));
      await this.storeTokens(userId, newTokens);
      return newTokens;
    }
    
    return {
      accessToken: mailbox.oauthAccessToken!,
      refreshToken: decrypt(mailbox.oauthRefreshToken!),
      expiresIn: Math.floor((mailbox.oauthExpiresAt.getTime() - Date.now()) / 1000)
    };
  }
}
```

### 11.3 Rate Limiting & Abuse Prevention

```typescript
// Rate limit mailbox creation
const createMailboxLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 mailboxes per hour per company
  keyGenerator: (req) => req.user.companyId
});

fastify.post('/admin/provision-mailbox', 
  { preHandler: [authenticate, requireAdmin, createMailboxLimiter] },
  provisionMailboxHandler
);
```

### 11.4 Audit Logging

```typescript
// Log all user/mailbox management actions
interface AuditLog {
  action: string;
  actorId: string;
  targetType: 'user' | 'mailbox' | 'domain';
  targetId: string;
  details: Record<string, any>;
  timestamp: Date;
  ip: string;
}

async function auditLog(log: AuditLog): Promise<void> {
  await prisma.auditLog.create({ data: log });
  
  // Also send to SIEM if configured
  if (config.siemEndpoint) {
    await sendToSIEM(log);
  }
}
```

---

## 12. Appendix: API References

### Self-Hosted Mail Server APIs

| Platform | Documentation |
|----------|---------------|
| Mailcow | https://docs.mailcow.email/api/ |
| Mailu | https://mailu.io/2.0/api.html |
| iRedMail | https://docs.iredmail.org/iredadmin-pro.restful.api.html |

### Cloud Provider APIs

| Provider | Documentation |
|----------|---------------|
| Google Workspace Admin SDK | https://developers.google.com/admin-sdk/directory |
| Microsoft Graph | https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview |
| Zoho Mail API | https://www.zoho.com/mail/help/api/ |

### Authentication Standards

| Standard | Use Case |
|----------|----------|
| OAuth 2.0 | Authorization framework |
| OpenID Connect | Identity layer on OAuth 2.0 |
| SAML 2.0 | Enterprise SSO |
| XOAUTH2 | IMAP/SMTP OAuth authentication |

### Libraries & SDKs

```javascript
// Google Workspace
npm install @googleapis/admin

// Microsoft Graph
npm install @microsoft/microsoft-graph-client

// Keycloak
npm install keycloak-admin

// IMAP with OAuth
npm install imap-simple
```

---

## Conclusion

This integration guide provides a comprehensive roadmap for unifying user management with email hosting in ExoinApp. The key recommendations are:

1. **Start with user-mailbox linking** - Leverage existing schema
2. **Implement auto-provisioning** - Reduce admin overhead
3. **Plan for SSO** - Better user experience and security
4. **Use existing services** - Build on the solid `emailHostingService` already in place
5. **Prioritize security** - Encrypt credentials, implement rate limiting, audit everything

The modular approach allows incremental implementation while maintaining system stability.

---

*Document Version: 1.0*  
*Last Updated: November 2024*  
*Author: ExoinApp Development Team*
