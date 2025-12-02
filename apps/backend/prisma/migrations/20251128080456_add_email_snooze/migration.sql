-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "snoozedFromFolder" TEXT,
ADD COLUMN     "snoozedUntil" TIMESTAMP(3);
