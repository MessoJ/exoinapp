-- AlterTable
ALTER TABLE "User" ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mailPassword" TEXT,
ADD COLUMN     "officeAddress" TEXT,
ADD COLUMN     "signatureEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signatureStyle" TEXT NOT NULL DEFAULT 'executive',
ADD COLUMN     "twitterUrl" TEXT;
