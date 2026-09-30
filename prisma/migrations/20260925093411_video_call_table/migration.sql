-- CreateTable
CREATE TABLE "videocalls" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roomUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videocalls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videocalls_roomId_key" ON "videocalls"("roomId");
