/*
  Warnings:

  - You are about to drop the column `endDate` on the `careassignment` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `careassignment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AssignmentFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND');

-- AlterTable
ALTER TABLE "careassignment" DROP COLUMN "endDate",
DROP COLUMN "startDate";

-- CreateTable
CREATE TABLE "careassignmentschedule" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "frequency" "AssignmentFrequency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "careassignmentschedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "careassignmentschedule" ADD CONSTRAINT "careassignmentschedule_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "careassignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
