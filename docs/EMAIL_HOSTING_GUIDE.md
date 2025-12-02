# 📧 Exoin Africa Email Hosting - Complete Implementation Guide

## Executive Summary

This document provides a comprehensive, world-class implementation plan for self-hosted email services for `exoinafrica.com`. The solution will be production-ready, secure, scalable, and fully integrated with the ExoinApp platform.

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXOIN EMAIL PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Client    │    │  ExoinApp   │    │   Webmail   │    │   Mobile    │  │
│  │  (Outlook)  │    │  (React)    │    │ (Roundcube) │    │   (IMAP)    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                     │                                        │
│                            ┌────────▼────────┐                              │
│                            │   NGINX Proxy   │                              │
│                            │   (SSL/TLS)     │                              │
│                            └────────┬────────┘                              │
│         ┌───────────────────────────┼───────────────────────────┐           │
│         │                           │                           │           │
│  ┌──────▼──────┐           ┌────────▼────────┐         ┌───────▼───────┐   │
│  │   Postfix   │◄─────────►│   Dovecot       │         │  ExoinApp     │   │
│  │   (SMTP)    │           │   (IMAP/POP3)   │         │  Backend API  │   │
│  │   Port 25   │           │   Port 993/995  │         │  Port 3000    │   │
│  └──────┬──────┘           └────────┬────────┘         └───────┬───────┘   │
│         │                           │                           │           │
│         └───────────────────────────┴───────────────────────────┘           │
│                                     │                                        │
│                            ┌────────▼────────┐                              │
│                            │   PostgreSQL    │                              │
│                            │   (Database)    │                              │
│                            └────────┬────────┘                              │
│                                     │                                        │
│  ┌──────────────┐    ┌──────────────┴──────────────┐    ┌──────────────┐   │
│  │   Rspamd     │    │     Email Storage           │    │   ClamAV     │   │
│  │  (Antispam)  │    │   (Maildir on Volume)       │    │  (Antivirus) │   │
│  └──────────────┘    └─────────────────────────────┘    └──────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              EXTERNAL SERVICES
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │    DNS      │    │ Let's       │    │  Cloudflare │    │   Domain    │  │
│  │  Provider   │    │ Encrypt     │    │    (CDN)    │    │  Registrar  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Requirements Checklist

### Domain Requirements

- [ ] Domain: `exoinafrica.com` (owned and accessible)
- [ ] DNS management access
- [ ] Ability to add MX, TXT, A, AAAA records
- [ ] Static IP address for mail server

### Server Requirements

- [ ] VPS/Dedicated server with:
  - Minimum 4GB RAM (8GB recommended)
  - 50GB+ SSD storage
  - Ubuntu 22.04 LTS or Debian 12
  - Static IPv4 address
  - Clean IP (not blacklisted)
  - Ports open: 25, 465, 587, 993, 995, 80, 443

### Software Stack

| Component | Purpose | Port(s) |
|-----------|---------|---------|
| Docker | Containerization | - |
| Postfix | SMTP Server | 25, 587, 465 |
| Dovecot | IMAP/POP3 Server | 993, 995, 143, 110 |
| Rspamd | Spam Filter | 11332 |
| ClamAV | Antivirus | 3310 |
| Redis | Cache/Queue | 6379 |
| PostgreSQL | Database | 5432 |
| Nginx | Reverse Proxy | 80, 443 |
| Let's Encrypt | SSL Certificates | - |

---

## 🌐 DNS Configuration

### Required DNS Records for `exoinafrica.com`

```dns
; ==== A/AAAA Records ====
mail.exoinafrica.com.    IN  A       YOUR_SERVER_IP
mail.exoinafrica.com.    IN  AAAA    YOUR_SERVER_IPV6    ; Optional

; ==== MX Record ====
exoinafrica.com.         IN  MX  10  mail.exoinafrica.com.

; ==== SPF Record ====
exoinafrica.com.         IN  TXT     "v=spf1 mx a ip4:YOUR_SERVER_IP ~all"

; ==== DKIM Record (generated after setup) ====
dkim._domainkey.exoinafrica.com.  IN  TXT  "v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY"

; ==== DMARC Record ====
_dmarc.exoinafrica.com.  IN  TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@exoinafrica.com; ruf=mailto:dmarc@exoinafrica.com; fo=1"

; ==== MTA-STS Record (optional but recommended) ====
_mta-sts.exoinafrica.com. IN TXT    "v=STSv1; id=20251126"

; ==== SMTP TLS Reporting ====
_smtp._tls.exoinafrica.com. IN TXT  "v=TLSRPTv1; rua=mailto:tls-reports@exoinafrica.com"

; ==== Autodiscover/Autoconfig for clients ====
autoconfig.exoinafrica.com.  IN  CNAME  mail.exoinafrica.com.
autodiscover.exoinafrica.com. IN CNAME  mail.exoinafrica.com.

; ==== Reverse DNS (PTR) - Set via hosting provider ====
; YOUR_SERVER_IP should resolve to mail.exoinafrica.com
```

### SPF Explained
```
v=spf1           # SPF version 1
mx               # Allow servers in MX records
a                # Allow server in A record
ip4:X.X.X.X      # Allow specific IP
~all             # Soft fail others (use -all for strict)
```

### DMARC Explained
```
v=DMARC1         # DMARC version 1
p=quarantine     # Policy: none, quarantine, or reject
rua=mailto:...   # Aggregate report destination
ruf=mailto:...   # Forensic report destination
fo=1             # Generate reports on any failure
```

---

## 🗄️ Database Schema

### New Tables for Email Hosting

Add to `apps/backend/prisma/schema.prisma`:

```prisma
// ==================== EMAIL ACCOUNTS ====================

model MailAccount {
  id            String       @id @default(uuid())
  email         String       @unique  // full email: user@exoinafrica.com
  username      String                // local part: user
  domain        String                // domain: exoinafrica.com
  passwordHash  String                // hashed password for IMAP/SMTP auth
  
  // Quotas
  quotaBytes    BigInt       @default(5368709120)  // 5GB default
  usedBytes     BigInt       @default(0)
  
  // Status
  isActive      Boolean      @default(true)
  isAdmin       Boolean      @default(false)
  
  // Features
  forwardTo     String?      // Forward emails to this address
  autoReply     Boolean      @default(false)
  autoReplySubject String?
  autoReplyMessage String?
  autoReplyStart   DateTime?
  autoReplyEnd     DateTime?
  
  // Relations
  userId        String?      @unique
  user          User?        @relation(fields: [userId], references: [id])
  
  aliases       MailAlias[]
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  @@index([domain])
  @@index([username, domain])
}

model MailDomain {
  id            String       @id @default(uuid())
  domain        String       @unique  // exoinafrica.com
  
  // DNS Status
  mxVerified    Boolean      @default(false)
  spfVerified   Boolean      @default(false)
  dkimVerified  Boolean      @default(false)
  dmarcVerified Boolean      @default(false)
  
  // DKIM Keys
  dkimSelector  String       @default("dkim")
  dkimPrivateKey String?     // Encrypted
  dkimPublicKey  String?
  
  // Settings
  isActive      Boolean      @default(true)
  catchAll      String?      // Catch-all email address
  maxAccounts   Int          @default(100)
  
  // Relations
  companyId     String
  company       Company      @relation(fields: [companyId], references: [id])
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model MailAlias {
  id            String       @id @default(uuid())
  alias         String       @unique  // alias@exoinafrica.com
  destination   String                // destination email
  
  accountId     String?
  account       MailAccount? @relation(fields: [accountId], references: [id])
  
  isActive      Boolean      @default(true)
  
  createdAt     DateTime     @default(now())
}

// ==================== EMAIL QUEUE & LOGS ====================

model MailQueue {
  id            String       @id @default(uuid())
  
  fromEmail     String
  toEmails      String[]
  ccEmails      String[]
  bccEmails     String[]
  subject       String
  htmlBody      String?
  textBody      String?
  
  // Attachments stored in object storage
  attachments   Json?        // [{filename, size, mimeType, storageKey}]
  
  // Status
  status        MailQueueStatus @default(PENDING)
  priority      Int          @default(0)  // Higher = more urgent
  attempts      Int          @default(0)
  maxAttempts   Int          @default(5)
  lastError     String?
  
  // Scheduling
  scheduledAt   DateTime?
  processedAt   DateTime?
  
  // Tracking
  messageId     String?
  
  userId        String
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  @@index([status, scheduledAt])
  @@index([userId])
}

enum MailQueueStatus {
  PENDING
  PROCESSING
  SENT
  DELIVERED
  FAILED
  BOUNCED
  CANCELLED
}

model MailLog {
  id            String       @id @default(uuid())
  
  messageId     String
  fromEmail     String
  toEmail       String
  subject       String?
  
  direction     MailDirection
  status        MailLogStatus
  
  // Details
  smtpResponse  String?
  errorMessage  String?
  
  // Metrics
  size          Int?         // bytes
  deliveryTime  Int?         // milliseconds
  
  // IP & Security
  sourceIp      String?
  spfResult     String?      // pass, fail, softfail, none
  dkimResult    String?      // pass, fail, none
  dmarcResult   String?      // pass, fail, none
  
  createdAt     DateTime     @default(now())
  
  @@index([messageId])
  @@index([fromEmail])
  @@index([toEmail])
  @@index([createdAt])
}

enum MailDirection {
  INBOUND
  OUTBOUND
}

enum MailLogStatus {
  ACCEPTED
  DELIVERED
  DEFERRED
  BOUNCED
  REJECTED
  SPAM
}

// ==================== SPAM & SECURITY ====================

model MailBlacklist {
  id            String       @id @default(uuid())
  type          BlacklistType
  value         String       // email, domain, or IP
  reason        String?
  
  createdBy     String
  expiresAt     DateTime?
  
  createdAt     DateTime     @default(now())
  
  @@unique([type, value])
  @@index([type])
}

enum BlacklistType {
  EMAIL
  DOMAIN
  IP
}

model MailWhitelist {
  id            String       @id @default(uuid())
  type          BlacklistType
  value         String
  reason        String?
  
  createdBy     String
  
  createdAt     DateTime     @default(now())
  
  @@unique([type, value])
}
```

---

## 🔧 Backend Implementation

### 1. Mail Account Service

**File: `apps/backend/src/services/mailAccountService.ts`**

```typescript
import { prisma } from '../index';
import argon2 from 'argon2';
import crypto from 'crypto';

interface CreateAccountOptions {
  email: string;
  password: string;
  userId?: string;
  quotaGB?: number;
}

class MailAccountService {
  // Create mail account
  async createAccount(options: CreateAccountOptions) {
    const { email, password, userId, quotaGB = 5 } = options;
    
    const [username, domain] = email.split('@');
    if (!username || !domain) {
      throw new Error('Invalid email format');
    }
    
    // Verify domain is registered
    const mailDomain = await prisma.mailDomain.findUnique({
      where: { domain }
    });
    
    if (!mailDomain || !mailDomain.isActive) {
      throw new Error(`Domain ${domain} is not configured for email`);
    }
    
    // Check account limit
    const accountCount = await prisma.mailAccount.count({
      where: { domain }
    });
    
    if (accountCount >= mailDomain.maxAccounts) {
      throw new Error('Maximum accounts reached for this domain');
    }
    
    // Hash password
    const passwordHash = await argon2.hash(password);
    
    return prisma.mailAccount.create({
      data: {
        email,
        username,
        domain,
        passwordHash,
        quotaBytes: BigInt(quotaGB * 1024 * 1024 * 1024),
        userId,
      }
    });
  }
  
  // Authenticate mail account (for IMAP/SMTP)
  async authenticate(email: string, password: string): Promise<boolean> {
    const account = await prisma.mailAccount.findUnique({
      where: { email }
    });
    
    if (!account || !account.isActive) {
      return false;
    }
    
    return argon2.verify(account.passwordHash, password);
  }
  
  // Update password
  async updatePassword(email: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);
    
    return prisma.mailAccount.update({
      where: { email },
      data: { passwordHash }
    });
  }
  
  // Set auto-reply
  async setAutoReply(email: string, options: {
    enabled: boolean;
    subject?: string;
    message?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.mailAccount.update({
      where: { email },
      data: {
        autoReply: options.enabled,
        autoReplySubject: options.subject,
        autoReplyMessage: options.message,
        autoReplyStart: options.startDate,
        autoReplyEnd: options.endDate,
      }
    });
  }
  
  // Set forwarding
  async setForwarding(email: string, forwardTo: string | null) {
    return prisma.mailAccount.update({
      where: { email },
      data: { forwardTo }
    });
  }
  
  // Get account usage stats
  async getStats(email: string) {
    const account = await prisma.mailAccount.findUnique({
      where: { email }
    });
    
    if (!account) throw new Error('Account not found');
    
    const totalEmails = await prisma.email.count({
      where: { fromAddress: email }
    });
    
    return {
      email: account.email,
      quotaBytes: Number(account.quotaBytes),
      usedBytes: Number(account.usedBytes),
      usagePercent: (Number(account.usedBytes) / Number(account.quotaBytes)) * 100,
      totalEmails,
      isActive: account.isActive,
    };
  }
}

export const mailAccountService = new MailAccountService();
```

### 2. Domain Management Service

**File: `apps/backend/src/services/mailDomainService.ts`**

```typescript
import { prisma } from '../index';
import crypto from 'crypto';
import dns from 'dns/promises';

class MailDomainService {
  // Add a new domain
  async addDomain(domain: string, companyId: string) {
    // Generate DKIM keys
    const { publicKey, privateKey } = await this.generateDKIMKeys();
    
    return prisma.mailDomain.create({
      data: {
        domain,
        companyId,
        dkimPublicKey: publicKey,
        dkimPrivateKey: privateKey,
      }
    });
  }
  
  // Generate DKIM key pair
  private async generateDKIMKeys(): Promise<{ publicKey: string; privateKey: string }> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        
        // Format public key for DNS TXT record
        const dnsPublicKey = publicKey
          .replace('-----BEGIN PUBLIC KEY-----', '')
          .replace('-----END PUBLIC KEY-----', '')
          .replace(/\n/g, '');
        
        resolve({
          publicKey: dnsPublicKey,
          privateKey,
        });
      });
    });
  }
  
  // Verify DNS records
  async verifyDNS(domain: string) {
    const results = {
      mx: false,
      spf: false,
      dkim: false,
      dmarc: false,
    };
    
    try {
      // Check MX
      const mx = await dns.resolveMx(domain);
      results.mx = mx.some(r => r.exchange.includes('mail.') || r.exchange.includes(domain));
      
      // Check SPF
      const txt = await dns.resolveTxt(domain);
      const spfRecord = txt.flat().find(r => r.startsWith('v=spf1'));
      results.spf = !!spfRecord;
      
      // Check DKIM
      try {
        const dkim = await dns.resolveTxt(`dkim._domainkey.${domain}`);
        results.dkim = dkim.flat().some(r => r.includes('v=DKIM1'));
      } catch { /* DKIM not set */ }
      
      // Check DMARC
      try {
        const dmarc = await dns.resolveTxt(`_dmarc.${domain}`);
        results.dmarc = dmarc.flat().some(r => r.includes('v=DMARC1'));
      } catch { /* DMARC not set */ }
      
    } catch (error) {
      console.error('DNS verification error:', error);
    }
    
    // Update database
    await prisma.mailDomain.update({
      where: { domain },
      data: {
        mxVerified: results.mx,
        spfVerified: results.spf,
        dkimVerified: results.dkim,
        dmarcVerified: results.dmarc,
      }
    });
    
    return results;
  }
  
  // Get DNS records to configure
  async getDNSRecords(domain: string) {
    const mailDomain = await prisma.mailDomain.findUnique({
      where: { domain }
    });
    
    if (!mailDomain) throw new Error('Domain not found');
    
    return {
      mx: {
        type: 'MX',
        host: '@',
        value: `mail.${domain}`,
        priority: 10,
        description: 'Mail exchange record - routes email to your mail server',
      },
      spf: {
        type: 'TXT',
        host: '@',
        value: `v=spf1 mx a ip4:YOUR_SERVER_IP ~all`,
        description: 'SPF record - authorizes your server to send email',
      },
      dkim: {
        type: 'TXT',
        host: `${mailDomain.dkimSelector}._domainkey`,
        value: `v=DKIM1; k=rsa; p=${mailDomain.dkimPublicKey}`,
        description: 'DKIM record - cryptographic signature for email authentication',
      },
      dmarc: {
        type: 'TXT',
        host: '_dmarc',
        value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
        description: 'DMARC record - policy for handling failed authentication',
      },
      mailA: {
        type: 'A',
        host: 'mail',
        value: 'YOUR_SERVER_IP',
        description: 'A record - points mail subdomain to your server',
      },
    };
  }
}

export const mailDomainService = new MailDomainService();
```

### 3. Mail Admin Routes

**File: `apps/backend/src/routes/mailAdmin.ts`**

```typescript
import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { mailAccountService } from '../services/mailAccountService';
import { mailDomainService } from '../services/mailDomainService';

export default async function mailAdminRoutes(fastify: FastifyInstance) {
  
  // ==================== DOMAINS ====================
  
  // List domains
  fastify.get('/domains', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const domains = await prisma.mailDomain.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    
    return { domains };
  });
  
  // Add domain
  fastify.post('/domains', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { domain } = request.body as any;
    
    const newDomain = await mailDomainService.addDomain(domain, companyId);
    return newDomain;
  });
  
  // Verify domain DNS
  fastify.post('/domains/:domain/verify', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { domain } = request.params as any;
    
    const results = await mailDomainService.verifyDNS(domain);
    return results;
  });
  
  // Get DNS records for domain
  fastify.get('/domains/:domain/dns', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { domain } = request.params as any;
    
    const records = await mailDomainService.getDNSRecords(domain);
    return records;
  });
  
  // ==================== ACCOUNTS ====================
  
  // List accounts
  fastify.get('/accounts', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    
    const domains = await prisma.mailDomain.findMany({
      where: { companyId },
      select: { domain: true },
    });
    
    const domainList = domains.map(d => d.domain);
    
    const accounts = await prisma.mailAccount.findMany({
      where: { domain: { in: domainList } },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return {
      accounts: accounts.map(a => ({
        ...a,
        quotaBytes: Number(a.quotaBytes),
        usedBytes: Number(a.usedBytes),
      }))
    };
  });
  
  // Create account
  fastify.post('/accounts', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { email, password, userId, quotaGB } = request.body as any;
    
    const account = await mailAccountService.createAccount({
      email,
      password,
      userId,
      quotaGB,
    });
    
    return account;
  });
  
  // Update account
  fastify.put('/accounts/:email', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { email } = request.params as any;
    const { forwardTo, autoReply, quotaGB, isActive } = request.body as any;
    
    const account = await prisma.mailAccount.update({
      where: { email },
      data: {
        forwardTo,
        autoReply: autoReply?.enabled,
        autoReplySubject: autoReply?.subject,
        autoReplyMessage: autoReply?.message,
        quotaBytes: quotaGB ? BigInt(quotaGB * 1024 * 1024 * 1024) : undefined,
        isActive,
      }
    });
    
    return account;
  });
  
  // Delete account
  fastify.delete('/accounts/:email', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { email } = request.params as any;
    
    await prisma.mailAccount.delete({
      where: { email }
    });
    
    return { success: true };
  });
  
  // ==================== ALIASES ====================
  
  // List aliases
  fastify.get('/aliases', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const aliases = await prisma.mailAlias.findMany({
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return { aliases };
  });
  
  // Create alias
  fastify.post('/aliases', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { alias, destination, accountId } = request.body as any;
    
    const newAlias = await prisma.mailAlias.create({
      data: { alias, destination, accountId }
    });
    
    return newAlias;
  });
  
  // ==================== LOGS & STATS ====================
  
  // Get mail logs
  fastify.get('/logs', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { page = '1', limit = '50', direction, status } = request.query as any;
    
    const where: any = {};
    if (direction) where.direction = direction;
    if (status) where.status = status;
    
    const [logs, total] = await Promise.all([
      prisma.mailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.mailLog.count({ where }),
    ]);
    
    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      }
    };
  });
  
  // Get statistics
  fastify.get('/stats', {
    preHandler: [(fastify as any).authenticate]
  }, async (request, reply) => {
    const { period = '7d' } = request.query as any;
    
    const periodDays = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    
    const [
      totalSent,
      totalReceived,
      bounced,
      spam,
      deliveryRate,
    ] = await Promise.all([
      prisma.mailLog.count({ where: { direction: 'OUTBOUND', createdAt: { gte: since } } }),
      prisma.mailLog.count({ where: { direction: 'INBOUND', createdAt: { gte: since } } }),
      prisma.mailLog.count({ where: { status: 'BOUNCED', createdAt: { gte: since } } }),
      prisma.mailLog.count({ where: { status: 'SPAM', createdAt: { gte: since } } }),
      prisma.mailLog.count({ where: { status: 'DELIVERED', createdAt: { gte: since } } }),
    ]);
    
    return {
      period,
      totalSent,
      totalReceived,
      bounced,
      spam,
      deliveryRate: totalSent > 0 ? ((deliveryRate / totalSent) * 100).toFixed(2) : '100.00',
    };
  });
}
```

---

## 🎨 Frontend Implementation

### Mail Admin Page Structure

```
src/pages/
├── MailAdminPage.jsx          # Main admin dashboard
├── MailDomainsPage.jsx        # Domain management
├── MailAccountsPage.jsx       # Account management
├── MailAliasesPage.jsx        # Alias management
├── MailLogsPage.jsx           # Delivery logs
├── MailQueuePage.jsx          # Queue monitoring
└── MailSettingsPage.jsx       # Server settings

src/components/mail-admin/
├── DomainCard.jsx             # Domain status card
├── DNSVerificationWizard.jsx  # DNS setup wizard
├── AccountForm.jsx            # Create/edit account
├── QuotaProgress.jsx          # Storage quota bar
├── MailStatsChart.jsx         # Statistics charts
├── DeliveryLogTable.jsx       # Log viewer
└── SpamSettingsPanel.jsx      # Spam configuration
```

### Key UI Features

#### 1. Domain Management Dashboard
- Add new domain with automatic DKIM key generation
- DNS record display with copy-to-clipboard
- Real-time DNS verification with status badges
- Domain statistics (accounts, emails sent/received)

#### 2. Account Management
- Create accounts linked to ExoinApp users
- Set storage quotas with visual progress
- Configure forwarding and auto-reply
- View account statistics

#### 3. Mail Analytics Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│                    📊 Email Analytics                        │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │ 1,234     │  │ 5,678     │  │ 98.5%     │  │ 12        ││
│  │ Sent      │  │ Received  │  │ Delivery  │  │ Bounced   ││
│  │ Today     │  │ Today     │  │ Rate      │  │ This Week ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │    📈 Email Volume (Last 7 Days)                     │   │
│  │    ▁▂▄▆█▇▅                                           │   │
│  │    Mon Tue Wed Thu Fri Sat Sun                       │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐳 Docker Compose Configuration

**File: `infrastructure/docker-compose.mail.yml`**

```yaml
version: '3.8'

services:
  # ==================== MAIL SERVER ====================
  mailserver:
    image: ghcr.io/docker-mailserver/docker-mailserver:latest
    container_name: exoin-mailserver
    hostname: mail.exoinafrica.com
    domainname: exoinafrica.com
    restart: always
    ports:
      - "25:25"      # SMTP
      - "465:465"    # SMTPS
      - "587:587"    # Submission
      - "993:993"    # IMAPS
      - "995:995"    # POP3S
    volumes:
      - maildata:/var/mail
      - mailstate:/var/mail-state
      - maillogs:/var/log/mail
      - ./config/mail:/tmp/docker-mailserver
      - /etc/letsencrypt:/etc/letsencrypt:ro
    environment:
      - ENABLE_SPAMASSASSIN=1
      - ENABLE_CLAMAV=1
      - ENABLE_FAIL2BAN=1
      - ENABLE_POSTGREY=1
      - SSL_TYPE=letsencrypt
      - PERMIT_DOCKER=network
      - ENABLE_DKIM=1
      - DKIM_SELECTOR=dkim
      - ENABLE_OPENDKIM=1
      - ENABLE_OPENDMARC=1
      - ENABLE_POLICYD_SPF=1
      - SPOOF_PROTECTION=1
      - POSTFIX_MESSAGE_SIZE_LIMIT=52428800
      - ENABLE_SRS=1
      - ENABLE_QUOTAS=1
    networks:
      - exoin-network
    cap_add:
      - NET_ADMIN
    healthcheck:
      test: ["CMD", "supervisorctl", "status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ==================== WEBMAIL ====================
  roundcube:
    image: roundcube/roundcubemail:latest
    container_name: exoin-webmail
    restart: always
    depends_on:
      - mailserver
    environment:
      - ROUNDCUBEMAIL_DEFAULT_HOST=ssl://mailserver
      - ROUNDCUBEMAIL_DEFAULT_PORT=993
      - ROUNDCUBEMAIL_SMTP_SERVER=tls://mailserver
      - ROUNDCUBEMAIL_SMTP_PORT=587
      - ROUNDCUBEMAIL_SKIN=elastic
      - ROUNDCUBEMAIL_UPLOAD_MAX_FILESIZE=25M
      - ROUNDCUBEMAIL_PLUGINS=archive,emoticons,markasjunk,zipdownload
    volumes:
      - roundcube:/var/www/html
    networks:
      - exoin-network

  # ==================== REDIS ====================
  redis:
    image: redis:7-alpine
    container_name: exoin-redis
    restart: always
    volumes:
      - redis-data:/data
    networks:
      - exoin-network
    command: redis-server --appendonly yes

volumes:
  maildata:
  mailstate:
  maillogs:
  roundcube:
  redis-data:

networks:
  exoin-network:
    external: true
```

---

## 🔐 Security Implementation

### 1. Rate Limiting

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(userId: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `ratelimit:email:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return current <= limit;
}

// Usage: 100 emails per hour per user
const canSend = await checkRateLimit(userId, 100, 3600);
```

### 2. Email Validation

```typescript
import { z } from 'zod';

const emailSchema = z.object({
  to: z.array(z.string().email()).min(1).max(50),
  cc: z.array(z.string().email()).max(50).optional(),
  bcc: z.array(z.string().email()).max(50).optional(),
  subject: z.string().min(1).max(998),
  html: z.string().max(10 * 1024 * 1024), // 10MB
});
```

### 3. Security Features
- Rspamd for spam scoring
- SPF, DKIM, DMARC verification
- Blacklist/whitelist management
- Greylisting for unknown senders
- ClamAV for virus scanning
- Fail2ban for brute force protection

---

## 🚀 Implementation Order

### Phase 1: Foundation (Week 1)
1. [ ] Update database schema with mail tables
2. [ ] Create mail account service
3. [ ] Create mail domain service
4. [ ] Add mail admin routes

### Phase 2: Docker Setup (Week 2)
5. [ ] Set up Docker mail server
6. [ ] Configure DNS records for exoinafrica.com
7. [ ] Set up SSL certificates
8. [ ] Configure DKIM/SPF/DMARC

### Phase 3: Frontend (Week 3)
9. [ ] Create mail admin dashboard
10. [ ] Domain management UI with DNS wizard
11. [ ] Account management UI
12. [ ] Logs and statistics

### Phase 4: Testing & Polish (Week 4)
13. [ ] End-to-end testing
14. [ ] Security audit
15. [ ] Performance optimization
16. [ ] Documentation

---

## ✅ Success Criteria

- [ ] Can send/receive emails using @exoinafrica.com
- [ ] SPF/DKIM/DMARC passing verification
- [ ] Webmail accessible
- [ ] Mail clients (Outlook, Thunderbird) can connect
- [ ] Spam filtering working
- [ ] Rate limiting preventing abuse
- [ ] 99.9% uptime target
- [ ] Delivery rate > 98%

---

*Document Version: 1.0*  
*Last Updated: November 2025*  
*Author: ExoinApp Development Team*
