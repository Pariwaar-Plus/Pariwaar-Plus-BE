/*
  Warnings:

  - You are about to drop the column `createdAt` on the `CareAssignment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "CareAssignment" DROP COLUMN "createdAt",
ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE';
