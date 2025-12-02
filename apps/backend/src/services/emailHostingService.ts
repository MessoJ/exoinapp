import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as dns from 'dns/promises';

const prisma = new PrismaClient();

// DNS Record Type enum matching Prisma schema
type DNSRecordType = 'MX' | 'TXT' | 'CNAME' | 'A' | 'AAAA' | 'SRV';

// ==================== GMAIL COMPATIBILITY NOTES ====================
// For Gmail to accept emails from your domain, you MUST have:
// 1. Valid PTR record (reverse DNS) - server IP must resolve to mail hostname
// 2. SPF record with explicit IP (-all recommended for best deliverability)
// 3. DKIM with 2048-bit RSA key (minimum, we use 2048)
// 4. DMARC with at least p=quarantine (p=reject preferred for reputation)
// 5. Valid SSL/TLS certificates on SMTP port 25/587
// 6. Server IP not on any blacklist (Spamhaus, Barracuda, etc.)

// ==================== DKIM KEY GENERATION ====================

function generateDKIMKeys(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // Gmail requires minimum 1024, 2048 recommended
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Extract just the base64 part for DNS TXT record
  const publicKeyBase64 = publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');

  return { publicKey: publicKeyBase64, privateKey };
}

function generateVerificationCode(): string {
  return `exoin-verify-${crypto.randomBytes(16).toString('hex')}`;
}

// ==================== PTR (REVERSE DNS) CHECK ====================
// Critical for Gmail - your server IP must resolve back to your mail hostname

export async function checkPTRRecord(serverIP: string, expectedHostname: string): Promise<{
  valid: boolean;
  found: string | null;
  message: string;
}> {
  try {
    const hostnames = await dns.reverse(serverIP);
    const found = hostnames[0] || null;
    const valid = hostnames.some(h => 
      h.toLowerCase() === expectedHostname.toLowerCase() ||
      h.toLowerCase() === `${expectedHostname}.`.toLowerCase()
    );
    
    return {
      valid,
      found,
      message: valid 
        ? 'PTR record correctly configured' 
        : `PTR mismatch: expected ${expectedHostname}, found ${found || 'none'}. Contact your hosting provider to set reverse DNS.`
    };
  } catch (error: any) {
    return {
      valid: false,
      found: null,
      message: `PTR lookup failed: ${error.code || error.message}. Ensure your server has a PTR record set by your hosting provider.`
    };
  }
}

// ==================== BLACKLIST CHECK ====================
// Check if server IP is on common email blacklists

const BLACKLIST_SERVERS = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'b.barracudacentral.org',
  'dnsbl.sorbs.net',
  'spam.dnsbl.sorbs.net',
];

export async function checkBlacklists(serverIP: string): Promise<{
  clean: boolean;
  listed: string[];
  message: string;
}> {
  const listed: string[] = [];
  
  // Reverse the IP for DNSBL lookup
  const reversedIP = serverIP.split('.').reverse().join('.');
  
  for (const bl of BLACKLIST_SERVERS) {
    try {
      await dns.resolve4(`${reversedIP}.${bl}`);
      // If resolves, the IP is listed
      listed.push(bl);
    } catch {
      // Not listed (NXDOMAIN)
    }
  }
  
  return {
    clean: listed.length === 0,
    listed,
    message: listed.length === 0 
      ? 'Server IP is not on any checked blacklists'
      : `Server IP is listed on: ${listed.join(', ')}. This will cause Gmail rejection.`
  };
}

// ==================== DOMAIN MANAGEMENT ====================

export async function createEmailDomain(
  domain: string,
  companyId: string,
  options?: {
    maxMailboxes?: number;
    maxAliases?: number;
    totalStorageQuotaMb?: number;
  }
): Promise<any> {
  // Generate DKIM keys
  const { publicKey, privateKey } = generateDKIMKeys();
  const verificationCode = generateVerificationCode();
  const dkimSelector = 'mail';

  // Create the domain
  const emailDomain = await prisma.emailDomain.create({
    data: {
      domain: domain.toLowerCase(),
      companyId,
      verificationCode,
      dkimSelector,
      dkimPublicKey: publicKey,
      dkimPrivateKey: privateKey, // In production, encrypt this
      maxMailboxes: options?.maxMailboxes ?? 50,
      maxAliases: options?.maxAliases ?? 100,
      totalStorageQuotaMb: options?.totalStorageQuotaMb ?? 51200,
    }
  });

  // Generate and store required DNS records
  await generateDNSRecords(emailDomain.id, domain, verificationCode, dkimSelector, publicKey);

  return emailDomain;
}

async function generateDNSRecords(
  domainId: string,
  domain: string,
  verificationCode: string,
  dkimSelector: string,
  dkimPublicKey: string
): Promise<void> {
  const serverHostname = process.env.MAIL_SERVER_HOSTNAME || `mail.${domain}`;
  const serverIP = process.env.MAIL_SERVER_IP || ''; // User needs to configure this

  // DNS records matching Mailu configuration for Gmail deliverability
  // Note: DKIM record should come from Mailu admin panel, not generated here
  const records: Array<{
    recordType: DNSRecordType;
    name: string;
    value: string;
    priority?: number;
    isRequired: boolean;
    description?: string;
  }> = [
    // MX Record - Priority 10 (matches Mailu)
    {
      recordType: 'MX',
      name: '@',
      value: serverHostname,
      priority: 10,
      isRequired: true,
      description: 'Routes incoming email to your Mailu server'
    },
    // SPF Record - Mailu uses ~all (soft fail), but -all is stricter for Gmail
    // Using Mailu's format for compatibility
    {
      recordType: 'TXT',
      name: '@',
      value: `v=spf1 mx a:${serverHostname} ~all`,
      isRequired: true,
      description: 'Authorizes your server to send email (SPF)'
    },
    // DKIM Record - This should be obtained from Mailu admin panel
    // The key here is a placeholder - user must replace with Mailu's actual DKIM key
    {
      recordType: 'TXT',
      name: `${dkimSelector}._domainkey`,
      value: dkimPublicKey ? `v=DKIM1; k=rsa; p=${dkimPublicKey}` : 'GET_FROM_MAILU_ADMIN_PANEL',
      isRequired: true,
      description: 'DKIM signature key - Get this from Mailu admin panel'
    },
    // DMARC Record - Start with p=none for monitoring, upgrade later
    {
      recordType: 'TXT',
      name: '_dmarc',
      value: `v=DMARC1; p=quarantine; sp=quarantine; pct=100; rua=mailto:dmarc-reports@${domain}`,
      isRequired: true,
      description: 'DMARC policy for handling failed authentication'
    },
    // Domain Verification for our platform
    {
      recordType: 'TXT',
      name: '@',
      value: verificationCode,
      isRequired: true,
      description: 'Verifies domain ownership in Exoin platform'
    },
    // Mail server A record (if IP is provided)
    ...(serverIP ? [{
      recordType: 'A' as DNSRecordType,
      name: 'mail',
      value: serverIP,
      isRequired: true,
      description: 'Points mail subdomain to your server IP'
    }] : []),
    // Autoconfig for Mozilla Thunderbird (matches Mailu)
    {
      recordType: 'CNAME',
      name: 'autoconfig',
      value: serverHostname,
      isRequired: false,
      description: 'Auto-configuration for Mozilla Thunderbird'
    },
    // Autodiscover for Microsoft Outlook (matches Mailu)
    {
      recordType: 'CNAME',
      name: 'autodiscover',
      value: serverHostname,
      isRequired: false,
      description: 'Auto-configuration for Microsoft Outlook'
    },
    // SRV records for email client auto-discovery (matches Mailu)
    {
      recordType: 'SRV',
      name: '_imaps._tcp',
      value: '10 1 993 ' + serverHostname,
      isRequired: false,
      description: 'IMAP over SSL service discovery'
    },
    {
      recordType: 'SRV',
      name: '_submissions._tcp',
      value: '10 1 465 ' + serverHostname,
      isRequired: false,
      description: 'SMTP submission over SSL service discovery'
    },
    {
      recordType: 'SRV',
      name: '_autodiscover._tcp',
      value: '10 1 443 ' + serverHostname,
      isRequired: false,
      description: 'Autodiscover service for Outlook'
    }
  ];

  await prisma.domainDNS.createMany({
    data: records.map(r => ({
      domainId,
      recordType: r.recordType,
      name: r.name,
      value: r.value,
      priority: r.priority,
      isRequired: r.isRequired,
      description: r.description
    }))
  });
}

export async function getDomainsByCompany(companyId: string): Promise<any[]> {
  return prisma.emailDomain.findMany({
    where: { companyId },
    include: {
      mailboxes: {
        select: { id: true, localPart: true, displayName: true, isActive: true }
      },
      aliases: {
        select: { id: true, localPart: true, isActive: true }
      },
      _count: {
        select: { mailboxes: true, aliases: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getDomainById(domainId: string): Promise<any> {
  return prisma.emailDomain.findUnique({
    where: { id: domainId },
    include: {
      mailboxes: true,
      aliases: {
        include: { targetMailbox: true }
      },
      dnsRecords: true
    }
  });
}

export async function getDomainDNSRecords(domainId: string): Promise<any[]> {
  return prisma.domainDNS.findMany({
    where: { domainId },
    orderBy: [{ recordType: 'asc' }, { name: 'asc' }]
  });
}

// Regenerate DNS records for an existing domain
export async function regenerateDNSRecords(domainId: string): Promise<any[]> {
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  // Delete existing DNS records
  await prisma.domainDNS.deleteMany({
    where: { domainId }
  });

  // Generate verification code if not present
  const verificationCode = domain.verificationCode || `exoin-verify-${crypto.randomBytes(8).toString('hex')}`;

  // Generate new DKIM keys if not present
  let dkimPublicKey = domain.dkimPublicKey;
  let dkimPrivateKey = domain.dkimPrivateKey;
  let dkimSelector = domain.dkimSelector || 'mail';

  if (!dkimPublicKey || !dkimPrivateKey) {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    dkimPrivateKey = keyPair.privateKey;
    dkimPublicKey = keyPair.publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\n/g, '');
  }

  // Update domain with keys and verification code
  await prisma.emailDomain.update({
    where: { id: domainId },
    data: {
      dkimPublicKey,
      dkimPrivateKey,
      dkimSelector,
      verificationCode
    }
  });

  // Generate new DNS records
  await generateDNSRecords(
    domainId,
    domain.domain,
    verificationCode,
    dkimSelector,
    dkimPublicKey
  );

  // Return the new records
  return prisma.domainDNS.findMany({
    where: { domainId },
    orderBy: [{ recordType: 'asc' }, { name: 'asc' }]
  });
}

// ==================== DNS VERIFICATION ====================

export async function verifyDNSRecords(domainId: string): Promise<{
  verified: boolean;
  results: Array<{
    recordType: string;
    name: string;
    expected: string;
    found: string | null;
    verified: boolean;
  }>;
}> {
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId },
    include: { dnsRecords: true }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  const results: Array<{
    recordType: string;
    name: string;
    expected: string;
    found: string | null;
    verified: boolean;
  }> = [];

  let allVerified = true;

  for (const record of domain.dnsRecords) {
    const hostname = record.name === '@' ? domain.domain : `${record.name}.${domain.domain}`;
    let found: string | null = null;
    let verified = false;

    try {
      switch (record.recordType) {
        case 'MX':
          const mxRecords = await dns.resolveMx(domain.domain);
          const mxMatch = mxRecords.find(mx => 
            mx.exchange.toLowerCase() === record.value.toLowerCase() ||
            mx.exchange.toLowerCase() === `${record.value}.`.toLowerCase()
          );
          if (mxMatch) {
            found = `${mxMatch.priority} ${mxMatch.exchange}`;
            verified = true;
          } else if (mxRecords.length > 0) {
            found = mxRecords.map(mx => `${mx.priority} ${mx.exchange}`).join(', ');
          }
          break;

        case 'TXT':
          const txtRecords = await dns.resolveTxt(hostname);
          const flatRecords = txtRecords.map(r => r.join('')).filter(r => r.length > 0);
          
          // For DKIM and SPF, do partial matching
          if (record.value.startsWith('v=DKIM1') || record.value.startsWith('v=spf1') || record.value.startsWith('v=DMARC1')) {
            const prefix = record.value.split(';')[0];
            const match = flatRecords.find(r => r.includes(prefix));
            if (match) {
              found = match;
              verified = true;
            }
          } else {
            // For verification codes, exact match
            const match = flatRecords.find(r => r === record.value);
            if (match) {
              found = match;
              verified = true;
            }
          }
          
          if (!found && flatRecords.length > 0) {
            found = flatRecords.slice(0, 3).join(' | ');
          }
          break;

        case 'A':
          const aRecords = await dns.resolve4(hostname);
          if (aRecords.includes(record.value)) {
            found = record.value;
            verified = true;
          } else if (aRecords.length > 0) {
            found = aRecords.join(', ');
          }
          break;

        case 'AAAA':
          const aaaaRecords = await dns.resolve6(hostname);
          if (aaaaRecords.includes(record.value)) {
            found = record.value;
            verified = true;
          } else if (aaaaRecords.length > 0) {
            found = aaaaRecords.join(', ');
          }
          break;

        case 'CNAME':
          const cnameRecords = await dns.resolveCname(hostname);
          if (cnameRecords.some(r => 
            r.toLowerCase() === record.value.toLowerCase() ||
            r.toLowerCase() === `${record.value}.`.toLowerCase()
          )) {
            found = record.value;
            verified = true;
          } else if (cnameRecords.length > 0) {
            found = cnameRecords.join(', ');
          }
          break;

        case 'SRV':
          try {
            const srvRecords = await dns.resolveSrv(hostname);
            // SRV record value format: "priority weight port target"
            const [priority, weight, port, target] = record.value.split(' ');
            const srvMatch = srvRecords.find(srv => 
              srv.port === parseInt(port) && 
              (srv.name.toLowerCase() === target.toLowerCase() ||
               srv.name.toLowerCase() === `${target}.`.toLowerCase())
            );
            if (srvMatch) {
              found = `${srvMatch.priority} ${srvMatch.weight} ${srvMatch.port} ${srvMatch.name}`;
              verified = true;
            } else if (srvRecords.length > 0) {
              found = srvRecords.map(s => `${s.priority} ${s.weight} ${s.port} ${s.name}`).join(', ');
            }
          } catch (srvError: any) {
            // SRV records might not exist, which is fine for optional records
            found = `Not configured`;
          }
          break;
      }
    } catch (error: any) {
      // DNS lookup failed
      found = `Error: ${error.code || error.message}`;
    }

    // Update record verification status
    await prisma.domainDNS.update({
      where: { id: record.id },
      data: { isVerified: verified, lastCheckedAt: new Date() }
    });

    if (record.isRequired && !verified) {
      allVerified = false;
    }

    results.push({
      recordType: record.recordType,
      name: record.name,
      expected: record.value.substring(0, 100) + (record.value.length > 100 ? '...' : ''),
      found,
      verified
    });
  }

  // Update domain verification status
  const mxVerified = results.find(r => r.recordType === 'MX')?.verified ?? false;
  const spfVerified = results.find(r => r.expected.startsWith('v=spf1'))?.verified ?? false;
  const dkimVerified = results.find(r => r.expected.startsWith('v=DKIM1'))?.verified ?? false;
  const dmarcVerified = results.find(r => r.expected.startsWith('v=DMARC1'))?.verified ?? false;
  const txtVerified = results.find(r => r.expected.startsWith('exoin-verify'))?.verified ?? false;

  await prisma.emailDomain.update({
    where: { id: domainId },
    data: {
      isVerified: txtVerified,
      verifiedAt: txtVerified ? new Date() : null,
      mxVerified,
      spfVerified,
      dkimVerified,
      dmarcVerified
    }
  });

  return { verified: allVerified, results };
}

// ==================== MAILBOX MANAGEMENT ====================

export async function createMailbox(
  domainId: string,
  localPart: string,
  password: string,
  options?: {
    displayName?: string;
    quotaMb?: number;
    isAdmin?: boolean;
    userId?: string;
  }
): Promise<any> {
  // Check domain exists and has capacity
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId },
    include: { _count: { select: { mailboxes: true } } }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  if (domain._count.mailboxes >= domain.maxMailboxes) {
    throw new Error(`Maximum mailboxes (${domain.maxMailboxes}) reached for this domain`);
  }

  // Validate local part
  const normalizedLocalPart = localPart.toLowerCase().trim();
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(normalizedLocalPart)) {
    throw new Error('Invalid mailbox name. Use only letters, numbers, dots, underscores, and hyphens.');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.mailbox.create({
    data: {
      domainId,
      localPart: normalizedLocalPart,
      displayName: options?.displayName,
      passwordHash,
      quotaMb: options?.quotaMb ?? 5120,
      isAdmin: options?.isAdmin ?? false,
      userId: options?.userId
    }
  });
}

export async function getMailboxesByDomain(domainId: string): Promise<any[]> {
  return prisma.mailbox.findMany({
    where: { domainId },
    include: {
      domain: { select: { domain: true } },
      targetAliases: true
    },
    orderBy: { localPart: 'asc' }
  });
}

export async function getMailboxById(mailboxId: string): Promise<any> {
  return prisma.mailbox.findUnique({
    where: { id: mailboxId },
    include: {
      domain: true,
      targetAliases: true
    }
  });
}

export async function updateMailbox(
  mailboxId: string,
  data: Partial<{
    displayName: string;
    quotaMb: number;
    isActive: boolean;
    autoReply: boolean;
    autoReplySubject: string;
    autoReplyMessage: string;
    autoReplyStart: Date;
    autoReplyEnd: Date;
    forwardingEnabled: boolean;
    forwardingAddress: string;
    keepCopy: boolean;
    spamFilterLevel: string;
    spamAction: string;
    signatureHtml: string;
    signatureText: string;
  }>
): Promise<any> {
  return prisma.mailbox.update({
    where: { id: mailboxId },
    data
  });
}

export async function updateMailboxPassword(mailboxId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.mailbox.update({
    where: { id: mailboxId },
    data: { passwordHash }
  });
}

export async function deleteMailbox(mailboxId: string): Promise<void> {
  await prisma.mailbox.delete({
    where: { id: mailboxId }
  });
}

// ==================== ALIAS MANAGEMENT ====================

export async function createEmailAlias(
  domainId: string,
  localPart: string,
  target: { mailboxId?: string; externalAddress?: string }
): Promise<any> {
  // Check domain exists and has capacity
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId },
    include: { _count: { select: { aliases: true } } }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  if (domain._count.aliases >= domain.maxAliases) {
    throw new Error(`Maximum aliases (${domain.maxAliases}) reached for this domain`);
  }

  // Validate local part
  const normalizedLocalPart = localPart.toLowerCase().trim();
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(normalizedLocalPart)) {
    throw new Error('Invalid alias name. Use only letters, numbers, dots, underscores, and hyphens.');
  }

  // Must have either mailbox or external target
  if (!target.mailboxId && !target.externalAddress) {
    throw new Error('Must specify either a mailbox or external address as target');
  }

  return prisma.emailAlias.create({
    data: {
      domainId,
      localPart: normalizedLocalPart,
      targetMailboxId: target.mailboxId,
      externalTarget: target.externalAddress
    }
  });
}

export async function getAliasesByDomain(domainId: string): Promise<any[]> {
  return prisma.emailAlias.findMany({
    where: { domainId },
    include: {
      domain: { select: { domain: true } },
      targetMailbox: { select: { localPart: true, displayName: true } }
    },
    orderBy: { localPart: 'asc' }
  });
}

export async function updateEmailAlias(
  aliasId: string,
  data: Partial<{
    isActive: boolean;
    targetMailboxId: string;
    externalTarget: string;
  }>
): Promise<any> {
  return prisma.emailAlias.update({
    where: { id: aliasId },
    data
  });
}

export async function deleteEmailAlias(aliasId: string): Promise<void> {
  await prisma.emailAlias.delete({
    where: { id: aliasId }
  });
}

// ==================== DOMAIN STATISTICS ====================

export async function getDomainStats(domainId: string): Promise<{
  totalMailboxes: number;
  activeMailboxes: number;
  totalAliases: number;
  activeAliases: number;
  usedStorageMb: number;
  totalStorageQuotaMb: number;
  storagePercentage: number;
  emailsSentToday: number;
  emailsReceivedToday: number;
}> {
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId },
    include: {
      mailboxes: {
        select: { isActive: true, usedMb: true, sentToday: true }
      },
      aliases: {
        select: { isActive: true }
      }
    }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  const totalMailboxes = domain.mailboxes.length;
  const activeMailboxes = domain.mailboxes.filter(m => m.isActive).length;
  const totalAliases = domain.aliases.length;
  const activeAliases = domain.aliases.filter(a => a.isActive).length;
  const usedStorageMb = domain.mailboxes.reduce((sum, m) => sum + m.usedMb, 0);
  const emailsSentToday = domain.mailboxes.reduce((sum, m) => sum + m.sentToday, 0);

  // Get received emails from log (today)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const receivedCount = await prisma.emailLog.count({
    where: {
      domainId,
      direction: 'inbound',
      createdAt: { gte: startOfDay }
    }
  });

  return {
    totalMailboxes,
    activeMailboxes,
    totalAliases,
    activeAliases,
    usedStorageMb,
    totalStorageQuotaMb: domain.totalStorageQuotaMb,
    storagePercentage: (usedStorageMb / domain.totalStorageQuotaMb) * 100,
    emailsSentToday,
    emailsReceivedToday: receivedCount
  };
}

// ==================== EMAIL LOGS ====================

export async function getEmailLogs(
  domainId: string,
  options?: {
    direction?: 'inbound' | 'outbound';
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: any[]; total: number }> {
  const where: any = { domainId };
  
  if (options?.direction) {
    where.direction = options.direction;
  }
  if (options?.status) {
    where.status = options.status;
  }

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.emailLog.count({ where })
  ]);

  return { logs, total };
}

// ==================== DELETE DOMAIN ====================

export async function deleteEmailDomain(domainId: string): Promise<void> {
  // This will cascade delete mailboxes, aliases, and DNS records
  await prisma.emailDomain.delete({
    where: { id: domainId }
  });
}

// ==================== GMAIL DELIVERABILITY CHECK ====================
// Comprehensive check to ensure emails will be accepted by Gmail

export interface GmailDeliverabilityResult {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor';
  checks: {
    name: string;
    passed: boolean;
    critical: boolean;
    message: string;
    howToFix?: string;
  }[];
  recommendations: string[];
}

export async function checkGmailDeliverability(domainId: string): Promise<GmailDeliverabilityResult> {
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId },
    include: { dnsRecords: true }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  const checks: GmailDeliverabilityResult['checks'] = [];
  const recommendations: string[] = [];
  const serverIP = process.env.MAIL_SERVER_IP;
  const serverHostname = process.env.MAIL_SERVER_HOSTNAME || `mail.${domain.domain}`;

  // 1. MX Record Check
  checks.push({
    name: 'MX Record',
    passed: domain.mxVerified,
    critical: true,
    message: domain.mxVerified 
      ? 'MX record is properly configured'
      : 'MX record is missing or incorrect',
    howToFix: domain.mxVerified ? undefined : `Add MX record: ${domain.domain} → ${serverHostname} (priority 10)`
  });

  // 2. SPF Record Check
  const spfRecord = domain.dnsRecords.find(r => r.value.startsWith('v=spf1'));
  const spfStrict = spfRecord?.value.includes('-all');
  checks.push({
    name: 'SPF Record',
    passed: domain.spfVerified,
    critical: true,
    message: domain.spfVerified 
      ? (spfStrict ? 'SPF record with strict policy (-all)' : 'SPF record configured but using soft fail (~all)')
      : 'SPF record is missing or incorrect',
    howToFix: domain.spfVerified 
      ? (spfStrict ? undefined : 'Change ~all to -all for stricter policy and better Gmail reputation')
      : `Add TXT record: ${domain.domain} → v=spf1 mx a ip4:YOUR_IP -all`
  });
  if (domain.spfVerified && !spfStrict) {
    recommendations.push('Upgrade SPF from ~all (soft fail) to -all (hard fail) for better deliverability');
  }

  // 3. DKIM Record Check
  const dkimSelector = domain.dkimSelector || 'mail';
  checks.push({
    name: 'DKIM Record',
    passed: domain.dkimVerified,
    critical: true,
    message: domain.dkimVerified 
      ? 'DKIM is properly configured with 2048-bit key'
      : 'DKIM record is missing or incorrect',
    howToFix: domain.dkimVerified ? undefined : `Add TXT record: ${dkimSelector}._domainkey.${domain.domain} → v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY`
  });

  // 4. DMARC Record Check
  const dmarcRecord = domain.dnsRecords.find(r => r.value.startsWith('v=DMARC1'));
  const dmarcPolicy = dmarcRecord?.value.match(/p=(none|quarantine|reject)/)?.[1] || 'none';
  const dmarcStrict = dmarcPolicy === 'reject' || dmarcPolicy === 'quarantine';
  checks.push({
    name: 'DMARC Record',
    passed: domain.dmarcVerified,
    critical: true,
    message: domain.dmarcVerified 
      ? `DMARC configured with p=${dmarcPolicy} policy`
      : 'DMARC record is missing or incorrect',
    howToFix: domain.dmarcVerified 
      ? (dmarcStrict ? undefined : 'Upgrade DMARC policy from p=none to p=quarantine or p=reject')
      : `Add TXT record: _dmarc.${domain.domain} → v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain.domain}`
  });
  if (domain.dmarcVerified && dmarcPolicy === 'none') {
    recommendations.push('Upgrade DMARC policy from p=none to p=quarantine for better spam protection');
  }

  // 5. PTR Record Check (Reverse DNS)
  let ptrPassed = false;
  let ptrMessage = 'PTR record check skipped (no server IP configured)';
  if (serverIP) {
    const ptrResult = await checkPTRRecord(serverIP, serverHostname);
    ptrPassed = ptrResult.valid;
    ptrMessage = ptrResult.message;
  }
  checks.push({
    name: 'PTR Record (Reverse DNS)',
    passed: ptrPassed,
    critical: true,
    message: ptrMessage,
    howToFix: ptrPassed ? undefined : 'Contact your hosting provider to set PTR record for your server IP to resolve to your mail hostname'
  });

  // 6. Blacklist Check
  let blacklistPassed = true;
  let blacklistMessage = 'Blacklist check skipped (no server IP configured)';
  if (serverIP) {
    const blResult = await checkBlacklists(serverIP);
    blacklistPassed = blResult.clean;
    blacklistMessage = blResult.message;
    if (!blResult.clean) {
      recommendations.push(`Your IP is listed on: ${blResult.listed.join(', ')}. Request delisting from each service.`);
    }
  }
  checks.push({
    name: 'IP Blacklist Check',
    passed: blacklistPassed,
    critical: true,
    message: blacklistMessage,
    howToFix: blacklistPassed ? undefined : 'Visit each blacklist website to request removal of your IP address'
  });

  // 7. A Record for mail subdomain
  let aRecordPassed = false;
  try {
    const aRecords = await dns.resolve4(`mail.${domain.domain}`);
    aRecordPassed = aRecords.length > 0;
    if (serverIP && !aRecords.includes(serverIP)) {
      aRecordPassed = false;
    }
  } catch {
    aRecordPassed = false;
  }
  checks.push({
    name: 'Mail Server A Record',
    passed: aRecordPassed,
    critical: false,
    message: aRecordPassed 
      ? 'mail.domain.com A record is configured'
      : 'mail.domain.com A record is missing',
    howToFix: aRecordPassed ? undefined : `Add A record: mail.${domain.domain} → YOUR_SERVER_IP`
  });

  // 8. Check domain verification
  checks.push({
    name: 'Domain Ownership Verified',
    passed: domain.isVerified,
    critical: false,
    message: domain.isVerified 
      ? 'Domain ownership is verified'
      : 'Domain ownership not yet verified',
    howToFix: domain.isVerified ? undefined : `Add TXT record with value: ${domain.verificationCode}`
  });

  // Calculate score
  const criticalChecks = checks.filter(c => c.critical);
  const nonCriticalChecks = checks.filter(c => !c.critical);
  
  const criticalScore = (criticalChecks.filter(c => c.passed).length / criticalChecks.length) * 70;
  const nonCriticalScore = (nonCriticalChecks.filter(c => c.passed).length / nonCriticalChecks.length) * 30;
  const score = Math.round(criticalScore + nonCriticalScore);

  let status: GmailDeliverabilityResult['status'];
  if (score >= 90) status = 'excellent';
  else if (score >= 70) status = 'good';
  else if (score >= 50) status = 'fair';
  else status = 'poor';

  // Add general recommendations
  if (score < 100) {
    if (!checks.find(c => c.name === 'PTR Record (Reverse DNS)')?.passed) {
      recommendations.unshift('⚠️ CRITICAL: PTR record is essential for Gmail. Without it, emails may be rejected.');
    }
    if (!checks.find(c => c.name === 'DKIM Record')?.passed) {
      recommendations.unshift('⚠️ CRITICAL: DKIM signing is required by Gmail for trusted delivery.');
    }
  }

  if (score === 100) {
    recommendations.push('✅ All checks passed! Your domain is well-configured for Gmail delivery.');
  }

  return {
    score,
    status,
    checks,
    recommendations
  };
}

// ==================== UPGRADE DMARC POLICY ====================
// Helper to upgrade DMARC policy for better deliverability

export async function upgradeDmarcPolicy(
  domainId: string, 
  policy: 'none' | 'quarantine' | 'reject'
): Promise<void> {
  const domain = await prisma.emailDomain.findUnique({
    where: { id: domainId }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  const dmarcValue = `v=DMARC1; p=${policy}; sp=${policy}; pct=100; adkim=s; aspf=s; rua=mailto:dmarc-reports@${domain.domain}; ruf=mailto:dmarc-forensic@${domain.domain}; fo=1`;

  // Update the DMARC DNS record
  await prisma.domainDNS.updateMany({
    where: {
      domainId,
      name: '_dmarc'
    },
    data: {
      value: dmarcValue
    }
  });

  // Update domain DMARC policy
  await prisma.emailDomain.update({
    where: { id: domainId },
    data: {
      dmarcPolicy: policy
    }
  });
}

export default {
  createEmailDomain,
  getDomainsByCompany,
  getDomainById,
  getDomainDNSRecords,
  regenerateDNSRecords,
  verifyDNSRecords,
  createMailbox,
  getMailboxesByDomain,
  getMailboxById,
  updateMailbox,
  updateMailboxPassword,
  deleteMailbox,
  createEmailAlias,
  getAliasesByDomain,
  updateEmailAlias,
  deleteEmailAlias,
  getDomainStats,
  getEmailLogs,
  deleteEmailDomain,
  // Gmail deliverability
  checkGmailDeliverability,
  checkPTRRecord,
  checkBlacklists,
  upgradeDmarcPolicy
};
