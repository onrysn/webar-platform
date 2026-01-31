-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('MODEL', 'SCENE');

-- AlterTable
ALTER TABLE "ARScene" ADD COLUMN     "categoryId" INTEGER;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "categoryType" "CategoryType" NOT NULL DEFAULT 'MODEL';

-- CreateIndex
CREATE INDEX "ARScene_categoryId_idx" ON "ARScene"("categoryId");

-- CreateIndex
CREATE INDEX "Category_categoryType_idx" ON "Category"("categoryType");

-- AddForeignKey
ALTER TABLE "ARScene" ADD CONSTRAINT "ARScene_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
