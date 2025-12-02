"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailDomain = createEmailDomain;
exports.getDomainsByCompany = getDomainsByCompany;
exports.getDomainById = getDomainById;
exports.getDomainDNSRecords = getDomainDNSRecords;
exports.verifyDNSRecords = verifyDNSRecords;
exports.createMailbox = createMailbox;
exports.getMailboxesByDomain = getMailboxesByDomain;
exports.getMailboxById = getMailboxById;
exports.updateMailbox = updateMailbox;
exports.updateMailboxPassword = updateMailboxPassword;
exports.deleteMailbox = deleteMailbox;
exports.createEmailAlias = createEmailAlias;
exports.getAliasesByDomain = getAliasesByDomain;
exports.updateEmailAlias = updateEmailAlias;
exports.deleteEmailAlias = deleteEmailAlias;
exports.getDomainStats = getDomainStats;
exports.getEmailLogs = getEmailLogs;
exports.deleteEmailDomain = deleteEmailDomain;
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcryptjs"));
const dns = __importStar(require("dns/promises"));
const prisma = new client_1.PrismaClient();
// ==================== DKIM KEY GENERATION ====================
function generateDKIMKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
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
function generateVerificationCode() {
    return `exoin-verify-${crypto.randomBytes(16).toString('hex')}`;
}
// ==================== DOMAIN MANAGEMENT ====================
async function createEmailDomain(domain, companyId, options) {
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
async function generateDNSRecords(domainId, domain, verificationCode, dkimSelector, dkimPublicKey) {
    const serverHostname = process.env.MAIL_SERVER_HOSTNAME || `mail.${domain}`;
    const serverIP = process.env.MAIL_SERVER_IP || ''; // User needs to configure this
    const records = [
        // MX Record
        {
            recordType: 'MX',
            name: '@',
            value: serverHostname,
            priority: 10,
            isRequired: true
        },
        // SPF Record
        {
            recordType: 'TXT',
            name: '@',
            value: `v=spf1 mx a:${serverHostname} ~all`,
            isRequired: true
        },
        // DKIM Record
        {
            recordType: 'TXT',
            name: `${dkimSelector}._domainkey`,
            value: `v=DKIM1; k=rsa; p=${dkimPublicKey}`,
            isRequired: true
        },
        // DMARC Record
        {
            recordType: 'TXT',
            name: '_dmarc',
            value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}; ruf=mailto:dmarc@${domain}; fo=1`,
            isRequired: true
        },
        // Domain Verification
        {
            recordType: 'TXT',
            name: '@',
            value: verificationCode,
            isRequired: true
        },
        // Mail server A record (if IP is provided)
        ...(serverIP ? [{
                recordType: 'A',
                name: 'mail',
                value: serverIP,
                isRequired: true
            }] : [])
    ];
    await prisma.domainDNS.createMany({
        data: records.map(r => ({
            domainId,
            recordType: r.recordType,
            name: r.name,
            value: r.value,
            priority: r.priority,
            isRequired: r.isRequired
        }))
    });
}
async function getDomainsByCompany(companyId) {
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
async function getDomainById(domainId) {
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
async function getDomainDNSRecords(domainId) {
    return prisma.domainDNS.findMany({
        where: { domainId },
        orderBy: [{ recordType: 'asc' }, { name: 'asc' }]
    });
}
// ==================== DNS VERIFICATION ====================
async function verifyDNSRecords(domainId) {
    const domain = await prisma.emailDomain.findUnique({
        where: { id: domainId },
        include: { dnsRecords: true }
    });
    if (!domain) {
        throw new Error('Domain not found');
    }
    const results = [];
    let allVerified = true;
    for (const record of domain.dnsRecords) {
        const hostname = record.name === '@' ? domain.domain : `${record.name}.${domain.domain}`;
        let found = null;
        let verified = false;
        try {
            switch (record.recordType) {
                case 'MX':
                    const mxRecords = await dns.resolveMx(domain.domain);
                    const mxMatch = mxRecords.find(mx => mx.exchange.toLowerCase() === record.value.toLowerCase() ||
                        mx.exchange.toLowerCase() === `${record.value}.`.toLowerCase());
                    if (mxMatch) {
                        found = `${mxMatch.priority} ${mxMatch.exchange}`;
                        verified = true;
                    }
                    else if (mxRecords.length > 0) {
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
                    }
                    else {
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
                    }
                    else if (aRecords.length > 0) {
                        found = aRecords.join(', ');
                    }
                    break;
                case 'AAAA':
                    const aaaaRecords = await dns.resolve6(hostname);
                    if (aaaaRecords.includes(record.value)) {
                        found = record.value;
                        verified = true;
                    }
                    else if (aaaaRecords.length > 0) {
                        found = aaaaRecords.join(', ');
                    }
                    break;
                case 'CNAME':
                    const cnameRecords = await dns.resolveCname(hostname);
                    if (cnameRecords.some(r => r.toLowerCase() === record.value.toLowerCase())) {
                        found = record.value;
                        verified = true;
                    }
                    else if (cnameRecords.length > 0) {
                        found = cnameRecords.join(', ');
                    }
                    break;
            }
        }
        catch (error) {
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
async function createMailbox(domainId, localPart, password, options) {
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
async function getMailboxesByDomain(domainId) {
    return prisma.mailbox.findMany({
        where: { domainId },
        include: {
            domain: { select: { domain: true } },
            targetAliases: true
        },
        orderBy: { localPart: 'asc' }
    });
}
async function getMailboxById(mailboxId) {
    return prisma.mailbox.findUnique({
        where: { id: mailboxId },
        include: {
            domain: true,
            targetAliases: true
        }
    });
}
async function updateMailbox(mailboxId, data) {
    return prisma.mailbox.update({
        where: { id: mailboxId },
        data
    });
}
async function updateMailboxPassword(mailboxId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.mailbox.update({
        where: { id: mailboxId },
        data: { passwordHash }
    });
}
async function deleteMailbox(mailboxId) {
    await prisma.mailbox.delete({
        where: { id: mailboxId }
    });
}
// ==================== ALIAS MANAGEMENT ====================
async function createEmailAlias(domainId, localPart, target) {
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
async function getAliasesByDomain(domainId) {
    return prisma.emailAlias.findMany({
        where: { domainId },
        include: {
            domain: { select: { domain: true } },
            targetMailbox: { select: { localPart: true, displayName: true } }
        },
        orderBy: { localPart: 'asc' }
    });
}
async function updateEmailAlias(aliasId, data) {
    return prisma.emailAlias.update({
        where: { id: aliasId },
        data
    });
}
async function deleteEmailAlias(aliasId) {
    await prisma.emailAlias.delete({
        where: { id: aliasId }
    });
}
// ==================== DOMAIN STATISTICS ====================
async function getDomainStats(domainId) {
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
async function getEmailLogs(domainId, options) {
    const where = { domainId };
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
async function deleteEmailDomain(domainId) {
    // This will cascade delete mailboxes, aliases, and DNS records
    await prisma.emailDomain.delete({
        where: { id: domainId }
    });
}
exports.default = {
    createEmailDomain,
    getDomainsByCompany,
    getDomainById,
    getDomainDNSRecords,
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
    deleteEmailDomain
};
