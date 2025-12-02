-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "labels" TEXT[],
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "scheduledAt" TIMESTAMP(3);
