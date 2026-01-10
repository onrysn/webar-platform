/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `ARModel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shareToken]` on the table `ARScene` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ARModel" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareToken" TEXT;

-- AlterTable
ALTER TABLE "ARScene" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memberCanEdit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shareToken" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "ARModel_shareToken_key" ON "ARModel"("shareToken");

-- CreateIndex
CREATE INDEX "ARModel_shareToken_idx" ON "ARModel"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "ARScene_shareToken_key" ON "ARScene"("shareToken");

-- CreateIndex
CREATE INDEX "ARScene_shareToken_idx" ON "ARScene"("shareToken");
