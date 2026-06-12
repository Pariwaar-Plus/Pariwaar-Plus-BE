/*
  Warnings:

  - You are about to drop the `CareAgent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CareAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CareReceiver` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VisitLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CareAgent" DROP CONSTRAINT "CareAgent_userId_fkey";

-- DropForeignKey
ALTER TABLE "CareAssignment" DROP CONSTRAINT "CareAssignment_careAgentId_fkey";

-- DropForeignKey
ALTER TABLE "CareAssignment" DROP CONSTRAINT "CareAssignment_careReceiverId_fkey";

-- DropForeignKey
ALTER TABLE "CareReceiver" DROP CONSTRAINT "CareReceiver_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "VisitLog" DROP CONSTRAINT "VisitLog_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "VisitLog" DROP CONSTRAINT "VisitLog_careAgentId_fkey";

-- DropTable
DROP TABLE "CareAgent";

-- DropTable
DROP TABLE "CareAssignment";

-- DropTable
DROP TABLE "CareReceiver";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "VisitLog";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careagents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "CareAgentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "qualification" TEXT NOT NULL,
    "specialization" TEXT,
    "experience" INTEGER NOT NULL,
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "ward" TEXT NOT NULL,
    "tole" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "citizenshipNo" TEXT,
    "licenseNo" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "careagents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "billingType" "BillingType" NOT NULL DEFAULT 'MONTHLY',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carereceivers" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "ward" TEXT NOT NULL,
    "tole" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "medicalCondition" TEXT,
    "allergies" TEXT,
    "mobilityStatus" "MobilityStatus" NOT NULL DEFAULT 'INDEPENDENT',
    "notes" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "carereceivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careassignment" (
    "id" TEXT NOT NULL,
    "careAgentId" TEXT NOT NULL,
    "careReceiverId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "careassignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitlogs" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "careAgentId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancellationReason" TEXT,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "pulseRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "oxygenSaturation" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bloodSugar" DOUBLE PRECISION,
    "respiratoryRate" INTEGER,
    "painLevel" INTEGER,
    "mood" "Mood",
    "medicationsGiven" TEXT,
    "medicationsSkipped" TEXT,
    "symptoms" TEXT,
    "woundCare" TEXT,
    "woundCondition" "WoundCondition",
    "mobilityAssessment" "MobilityStatus",
    "mobilityNotes" TEXT,
    "agentNotes" TEXT,
    "adminNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "visitlogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "careagents_userId_key" ON "careagents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "careagents_employeeId_key" ON "careagents"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "careagents_phone_key" ON "careagents"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "careagents_citizenshipNo_key" ON "careagents"("citizenshipNo");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_phone_key" ON "clients"("phone");

-- AddForeignKey
ALTER TABLE "careagents" ADD CONSTRAINT "careagents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carereceivers" ADD CONSTRAINT "carereceivers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "careassignment" ADD CONSTRAINT "careassignment_careAgentId_fkey" FOREIGN KEY ("careAgentId") REFERENCES "careagents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "careassignment" ADD CONSTRAINT "careassignment_careReceiverId_fkey" FOREIGN KEY ("careReceiverId") REFERENCES "carereceivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitlogs" ADD CONSTRAINT "visitlogs_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "careassignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitlogs" ADD CONSTRAINT "visitlogs_careAgentId_fkey" FOREIGN KEY ("careAgentId") REFERENCES "careagents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
