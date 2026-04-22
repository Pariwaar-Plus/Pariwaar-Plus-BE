-- AlterTable
ALTER TABLE "CareAgent" ADD COLUMN     "tole" TEXT,
ADD COLUMN     "ward" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "CareReceiver" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "ward" TEXT,
    "tole" TEXT,
    "medicalHistory" TEXT,
    "existingConditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareReceiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareAssignment" (
    "id" TEXT NOT NULL,
    "careReceiverId" TEXT NOT NULL,
    "careAgentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL,
    "careReceiverId" TEXT NOT NULL,
    "careAgentId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolicBP" INTEGER NOT NULL,
    "diastolicBP" INTEGER NOT NULL,
    "bloodSugar" DOUBLE PRECISION,
    "oxygenLevel" INTEGER,
    "weight" DOUBLE PRECISION,
    "generalNotes" TEXT,
    "medicationAdherence" BOOLEAN NOT NULL,
    "medicationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareAssignment_careReceiverId_careAgentId_key" ON "CareAssignment"("careReceiverId", "careAgentId");

-- AddForeignKey
ALTER TABLE "CareReceiver" ADD CONSTRAINT "CareReceiver_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_careReceiverId_fkey" FOREIGN KEY ("careReceiverId") REFERENCES "CareReceiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_careAgentId_fkey" FOREIGN KEY ("careAgentId") REFERENCES "CareAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_careReceiverId_fkey" FOREIGN KEY ("careReceiverId") REFERENCES "CareReceiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_careAgentId_fkey" FOREIGN KEY ("careAgentId") REFERENCES "CareAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
