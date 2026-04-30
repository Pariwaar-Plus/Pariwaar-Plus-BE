-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('SON', 'DAUGHTER', 'RELATIVE', 'LEGAL_GUARDIAN');

-- AlterTable
ALTER TABLE "CareReceiver" ADD COLUMN     "relationship" "Relationship";

-- CreateIndex
CREATE INDEX "CareReceiver_clientId_idx" ON "CareReceiver"("clientId");
