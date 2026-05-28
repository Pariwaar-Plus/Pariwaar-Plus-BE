/*
  Warnings:

  - You are about to drop the column `contact` on the `CareAgent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `CareAgent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `CareAgent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[citizenshipNo]` on the table `CareAgent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateOfBirth` to the `CareAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `CareAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `CareAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `CareAgent` table without a default value. This is not possible if the table is not empty.
  - Made the column `city` on table `CareAgent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tole` on table `CareAgent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ward` on table `CareAgent` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CareAgentStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'ON_LEAVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "CareAgent" DROP CONSTRAINT "CareAgent_userId_fkey";

-- AlterTable
ALTER TABLE "CareAgent" DROP COLUMN "contact",
ADD COLUMN     "citizenshipNo" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "licenseNo" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "status" "CareAgentStatus" NOT NULL DEFAULT 'AVAILABLE',
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "tole" SET NOT NULL,
ALTER COLUMN "ward" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CareAgent_employeeId_key" ON "CareAgent"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "CareAgent_phone_key" ON "CareAgent"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CareAgent_citizenshipNo_key" ON "CareAgent"("citizenshipNo");

-- AddForeignKey
ALTER TABLE "CareAgent" ADD CONSTRAINT "CareAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
