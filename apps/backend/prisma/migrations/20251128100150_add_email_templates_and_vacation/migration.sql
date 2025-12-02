-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('GENERAL', 'SALES', 'SUPPORT', 'MARKETING', 'HR', 'FINANCE', 'FOLLOW_UP', 'MEETING', 'INTRODUCTION', 'THANK_YOU');

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT,
    "textBody" TEXT,
    "category" "EmailTemplateCategory" NOT NULL DEFAULT 'GENERAL',
    "placeholders" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacationResponder" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'Out of Office',
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onlyContacts" BOOLEAN NOT NULL DEFAULT false,
    "onlyOnce" BOOLEAN NOT NULL DEFAULT true,
    "excludedDomains" TEXT[],
    "respondedTo" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VacationResponder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTemplate_userId_idx" ON "EmailTemplate"("userId");

-- CreateIndex
CREATE INDEX "EmailTemplate_companyId_idx" ON "EmailTemplate"("companyId");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE UNIQUE INDEX "VacationResponder_userId_key" ON "VacationResponder"("userId");

-- CreateIndex
CREATE INDEX "VacationResponder_userId_idx" ON "VacationResponder"("userId");

-- CreateIndex
CREATE INDEX "VacationResponder_isActive_startDate_endDate_idx" ON "VacationResponder"("isActive", "startDate", "endDate");
