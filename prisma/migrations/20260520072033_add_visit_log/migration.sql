/*
  Warnings:

  - The values [INACTIVE] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `age` on the `CareReceiver` table. All the data in the column will be lost.
  - You are about to drop the column `contactNumber` on the `CareReceiver` table. All the data in the column will be lost.
  - You are about to drop the column `existingConditions` on the `CareReceiver` table. All the data in the column will be lost.
  - You are about to drop the column `medicalHistory` on the `CareReceiver` table. All the data in the column will be lost.
  - You are about to drop the column `relationship` on the `CareReceiver` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `careReceiverId` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `diastolicBP` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `generalNotes` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `medicationAdherence` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `medicationNotes` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `oxygenLevel` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `systolicBP` on the `VisitLog` table. All the data in the column will be lost.
  - You are about to drop the column `visitDate` on the `VisitLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateOfBirth` to the `CareReceiver` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `CareReceiver` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `ward` on table `CareReceiver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tole` on table `CareReceiver` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `countryCode` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timezone` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Made the column `country` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `assignmentId` to the `VisitLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `VisitLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledAt` to the `VisitLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VisitLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MobilityStatus" AS ENUM ('INDEPENDENT', 'ASSISTED', 'WHEELCHAIR', 'BEDRIDDEN');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'CALM', 'ANXIOUS', 'CONFUSED', 'AGITATED', 'DEPRESSED');

-- CreateEnum
CREATE TYPE "WoundCondition" AS ENUM ('HEALING', 'STABLE', 'WORSENING', 'INFECTED', 'NOT_APPLICABLE');

-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD');
ALTER TABLE "public"."CareAssignment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CareAssignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "public"."AssignmentStatus_old";
ALTER TABLE "CareAssignment" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "VisitLog" DROP CONSTRAINT "VisitLog_careReceiverId_fkey";

-- DropIndex
DROP INDEX "CareAssignment_careReceiverId_status_idx";

-- DropIndex
DROP INDEX "CareReceiver_clientId_idx";

-- AlterTable
ALTER TABLE "CareAssignment" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "CareReceiver" DROP COLUMN "age",
DROP COLUMN "contactNumber",
DROP COLUMN "existingConditions",
DROP COLUMN "medicalHistory",
DROP COLUMN "relationship",
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "medicalCondition" TEXT,
ADD COLUMN     "mobilityStatus" "MobilityStatus" NOT NULL DEFAULT 'INDEPENDENT',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL,
ALTER COLUMN "ward" SET NOT NULL,
ALTER COLUMN "tole" SET NOT NULL;

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "contact",
ADD COLUMN     "billingType" "BillingType" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "countryCode" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "country" SET NOT NULL;

-- AlterTable
ALTER TABLE "VisitLog" DROP COLUMN "careReceiverId",
DROP COLUMN "diastolicBP",
DROP COLUMN "generalNotes",
DROP COLUMN "medicationAdherence",
DROP COLUMN "medicationNotes",
DROP COLUMN "oxygenLevel",
DROP COLUMN "systolicBP",
DROP COLUMN "visitDate",
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "agentNotes" TEXT,
ADD COLUMN     "assignmentId" TEXT NOT NULL,
ADD COLUMN     "bloodPressureDiastolic" INTEGER,
ADD COLUMN     "bloodPressureSystolic" INTEGER,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "checkInAt" TIMESTAMP(3),
ADD COLUMN     "checkOutAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "medicationsGiven" TEXT,
ADD COLUMN     "medicationsSkipped" TEXT,
ADD COLUMN     "mobilityAssessment" "MobilityStatus",
ADD COLUMN     "mobilityNotes" TEXT,
ADD COLUMN     "mood" "Mood",
ADD COLUMN     "oxygenSaturation" DOUBLE PRECISION,
ADD COLUMN     "painLevel" INTEGER,
ADD COLUMN     "pulseRate" INTEGER,
ADD COLUMN     "respiratoryRate" INTEGER,
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "symptoms" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ADD COLUMN     "woundCare" TEXT,
ADD COLUMN     "woundCondition" "WoundCondition";

-- CreateIndex
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CareAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
