-- CreateEnum
CREATE TYPE "MailboxAuditAction" AS ENUM ('MAILBOX_CREATED', 'MAILBOX_UPDATED', 'MAILBOX_DELETED', 'MAILBOX_LINKED_TO_USER', 'MAILBOX_UNLINKED_FROM_USER', 'MAILBOX_PASSWORD_CHANGED', 'MAILBOX_QUOTA_CHANGED', 'MAILBOX_ACTIVATED', 'MAILBOX_DEACTIVATED', 'USER_PROVISIONED_MAILBOX', 'BULK_IMPORT_STARTED', 'BULK_IMPORT_COMPLETED', 'DOMAIN_SETTINGS_CHANGED');

-- DropIndex
DROP INDEX "Email_searchVector_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoProvisionEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSsoLogin" TIMESTAMP(3),
ADD COLUMN     "primaryMailboxId" TEXT,
ADD COLUMN     "ssoExternalId" TEXT,
ADD COLUMN     "ssoProvider" TEXT;

-- CreateTable
CREATE TABLE "EmailHostingSettings" (
    "id" TEXT NOT NULL,
    "defaultDomainId" TEXT,
    "emailFormat" TEXT NOT NULL DEFAULT 'firstname.lastname',
    "autoProvisionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultQuotaMb" INTEGER NOT NULL DEFAULT 5120,
    "defaultMaxSendPerDay" INTEGER NOT NULL DEFAULT 500,
    "notifyOnProvision" BOOLEAN NOT NULL DEFAULT true,
    "welcomeEmailTemplate" TEXT,
    "requireStrongPassword" BOOLEAN NOT NULL DEFAULT true,
    "minPasswordLength" INTEGER NOT NULL DEFAULT 8,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailHostingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxAuditLog" (
    "id" TEXT NOT NULL,
    "action" "MailboxAuditAction" NOT NULL,
    "mailboxId" TEXT,
    "userId" TEXT,
    "domainId" TEXT,
    "performedById" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailboxAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailHostingSettings_companyId_key" ON "EmailHostingSettings"("companyId");

-- CreateIndex
CREATE INDEX "EmailHostingSettings_companyId_idx" ON "EmailHostingSettings"("companyId");

-- CreateIndex
CREATE INDEX "MailboxAuditLog_mailboxId_idx" ON "MailboxAuditLog"("mailboxId");

-- CreateIndex
CREATE INDEX "MailboxAuditLog_userId_idx" ON "MailboxAuditLog"("userId");

-- CreateIndex
CREATE INDEX "MailboxAuditLog_companyId_idx" ON "MailboxAuditLog"("companyId");

-- CreateIndex
CREATE INDEX "MailboxAuditLog_action_idx" ON "MailboxAuditLog"("action");

-- CreateIndex
CREATE INDEX "MailboxAuditLog_createdAt_idx" ON "MailboxAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Email_userId_idx" ON "Email"("userId");

-- CreateIndex
CREATE INDEX "Email_folder_idx" ON "Email"("folder");

-- CreateIndex
CREATE INDEX "Email_sentAt_idx" ON "Email"("sentAt");

-- CreateIndex
CREATE INDEX "User_ssoProvider_ssoExternalId_idx" ON "User"("ssoProvider", "ssoExternalId");

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
