-- AlterEnum
ALTER TYPE "DNSRecordType" ADD VALUE 'SRV';

-- AlterTable
ALTER TABLE "DomainDNS" ADD COLUMN     "description" TEXT;
