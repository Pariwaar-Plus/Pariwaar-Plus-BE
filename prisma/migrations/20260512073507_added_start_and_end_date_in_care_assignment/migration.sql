/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `CareAssignment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CareAssignment_careReceiverId_careAgentId_key";

-- AlterTable
ALTER TABLE "CareAssignment" DROP COLUMN "assignedAt",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "CareAssignment_careReceiverId_status_idx" ON "CareAssignment"("careReceiverId", "status");
