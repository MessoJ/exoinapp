-- CreateEnum
CREATE TYPE "MailMergeStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpBackupCodes" TEXT[],
ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpLastUsed" TIMESTAMP(3),
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "EmailTracking" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "emailId" TEXT,
    "outboxId" TEXT,
    "subject" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "firstOpenedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTrackingEvent" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLinkClick" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 1,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "firstClickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastClickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMerge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT,
    "textBody" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "recipients" JSONB NOT NULL,
    "status" "MailMergeStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailMerge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTracking_trackingId_key" ON "EmailTracking"("trackingId");

-- CreateIndex
CREATE INDEX "EmailTracking_userId_idx" ON "EmailTracking"("userId");

-- CreateIndex
CREATE INDEX "EmailTracking_trackingId_idx" ON "EmailTracking"("trackingId");

-- CreateIndex
CREATE INDEX "EmailTracking_createdAt_idx" ON "EmailTracking"("createdAt");

-- CreateIndex
CREATE INDEX "EmailTrackingEvent_trackingId_idx" ON "EmailTrackingEvent"("trackingId");

-- CreateIndex
CREATE INDEX "EmailLinkClick_trackingId_idx" ON "EmailLinkClick"("trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLinkClick_trackingId_originalUrl_key" ON "EmailLinkClick"("trackingId", "originalUrl");

-- CreateIndex
CREATE INDEX "MailMerge_userId_idx" ON "MailMerge"("userId");

-- CreateIndex
CREATE INDEX "MailMerge_status_idx" ON "MailMerge"("status");

-- AddForeignKey
ALTER TABLE "EmailTrackingEvent" ADD CONSTRAINT "EmailTrackingEvent_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "EmailTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLinkClick" ADD CONSTRAINT "EmailLinkClick_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "EmailTracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
