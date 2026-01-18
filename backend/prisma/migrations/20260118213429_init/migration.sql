-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('QUEUED', 'CONVERTING', 'CONVERTED', 'WAITING_APPROVAL', 'APPROVED', 'ERROR');

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "maxApiKeys" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "ModelUploadJob" (
    "id" TEXT NOT NULL,
    "tempId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "inputPath" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "glbPath" TEXT,
    "usdzPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelUploadJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelUploadJob_tempId_key" ON "ModelUploadJob"("tempId");

-- CreateIndex
CREATE INDEX "ModelUploadJob_tempId_idx" ON "ModelUploadJob"("tempId");

-- CreateIndex
CREATE INDEX "ModelUploadJob_status_createdAt_idx" ON "ModelUploadJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ModelUploadJob" ADD CONSTRAINT "ModelUploadJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelUploadJob" ADD CONSTRAINT "ModelUploadJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
