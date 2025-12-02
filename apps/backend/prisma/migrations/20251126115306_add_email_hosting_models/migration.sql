-- CreateEnum
CREATE TYPE "DNSRecordType" AS ENUM ('MX', 'TXT', 'CNAME', 'A', 'AAAA');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'REJECTED', 'SPAM', 'FAILED');

-- CreateTable
CREATE TABLE "EmailDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verificationCode" TEXT,
    "verificationMethod" TEXT NOT NULL DEFAULT 'txt',
    "verifiedAt" TIMESTAMP(3),
    "dkimSelector" TEXT,
    "dkimPublicKey" TEXT,
    "dkimPrivateKey" TEXT,
    "dkimVerified" BOOLEAN NOT NULL DEFAULT false,
    "spfRecord" TEXT,
    "spfVerified" BOOLEAN NOT NULL DEFAULT false,
    "dmarcPolicy" TEXT NOT NULL DEFAULT 'none',
    "dmarcRecord" TEXT,
    "dmarcVerified" BOOLEAN NOT NULL DEFAULT false,
    "mxVerified" BOOLEAN NOT NULL DEFAULT false,
    "catchAllEnabled" BOOLEAN NOT NULL DEFAULT false,
    "catchAllMailboxId" TEXT,
    "maxMailboxes" INTEGER NOT NULL DEFAULT 50,
    "maxAliases" INTEGER NOT NULL DEFAULT 100,
    "totalStorageQuotaMb" INTEGER NOT NULL DEFAULT 51200,
    "usedStorageMb" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "displayName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "quotaMb" INTEGER NOT NULL DEFAULT 5120,
    "usedMb" INTEGER NOT NULL DEFAULT 0,
    "maxSendPerDay" INTEGER NOT NULL DEFAULT 500,
    "sentToday" INTEGER NOT NULL DEFAULT 0,
    "lastSentReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "autoReplySubject" TEXT,
    "autoReplyMessage" TEXT,
    "autoReplyStart" TIMESTAMP(3),
    "autoReplyEnd" TIMESTAMP(3),
    "forwardingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "forwardingAddress" TEXT,
    "keepCopy" BOOLEAN NOT NULL DEFAULT true,
    "spamFilterLevel" TEXT NOT NULL DEFAULT 'medium',
    "spamAction" TEXT NOT NULL DEFAULT 'folder',
    "signatureHtml" TEXT,
    "signatureText" TEXT,
    "userId" TEXT,
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAlias" (
    "id" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "targetMailboxId" TEXT,
    "externalTarget" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainDNS" (
    "id" TEXT NOT NULL,
    "recordType" "DNSRecordType" NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "priority" INTEGER,
    "ttl" INTEGER NOT NULL DEFAULT 3600,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3),
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainDNS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "direction" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT,
    "status" "EmailLogStatus" NOT NULL,
    "errorMessage" TEXT,
    "sizeBytes" INTEGER,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "smtpCode" INTEGER,
    "smtpResponse" TEXT,
    "spamScore" DOUBLE PRECISION,
    "spamAction" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "domainId" TEXT,
    "mailboxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailQuarantined" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT,
    "reason" TEXT NOT NULL,
    "spamScore" DOUBLE PRECISION,
    "rawHeaders" TEXT,
    "previewText" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailQuarantined_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailDomain_domain_key" ON "EmailDomain"("domain");

-- CreateIndex
CREATE INDEX "EmailDomain_domain_idx" ON "EmailDomain"("domain");

-- CreateIndex
CREATE INDEX "EmailDomain_companyId_idx" ON "EmailDomain"("companyId");

-- CreateIndex
CREATE INDEX "Mailbox_domainId_idx" ON "Mailbox"("domainId");

-- CreateIndex
CREATE INDEX "Mailbox_userId_idx" ON "Mailbox"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_localPart_domainId_key" ON "Mailbox"("localPart", "domainId");

-- CreateIndex
CREATE INDEX "EmailAlias_domainId_idx" ON "EmailAlias"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAlias_localPart_domainId_key" ON "EmailAlias"("localPart", "domainId");

-- CreateIndex
CREATE INDEX "DomainDNS_domainId_idx" ON "DomainDNS"("domainId");

-- CreateIndex
CREATE INDEX "EmailLog_domainId_idx" ON "EmailLog"("domainId");

-- CreateIndex
CREATE INDEX "EmailLog_mailboxId_idx" ON "EmailLog"("mailboxId");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailQuarantined_domainId_idx" ON "EmailQuarantined"("domainId");

-- CreateIndex
CREATE INDEX "EmailQuarantined_createdAt_idx" ON "EmailQuarantined"("createdAt");

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "EmailDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAlias" ADD CONSTRAINT "EmailAlias_targetMailboxId_fkey" FOREIGN KEY ("targetMailboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAlias" ADD CONSTRAINT "EmailAlias_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "EmailDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainDNS" ADD CONSTRAINT "DomainDNS_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "EmailDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
