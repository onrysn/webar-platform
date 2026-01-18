-- CreateEnum
CREATE TYPE "ShapeCategory" AS ENUM ('BASIC', 'GEOMETRIC', 'ARCHITECTURAL', 'ARROWS', 'SYMBOLS', 'CONTROLS', 'ICONS', 'NATURE', 'OBJECTS', 'CUSTOM');

-- AlterTable
ALTER TABLE "ARModel" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "seriesId" INTEGER;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "maxStorage" INTEGER;

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shape" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "svgPath" TEXT NOT NULL,
    "labelTR" TEXT NOT NULL,
    "labelEN" TEXT,
    "descTR" TEXT,
    "descEN" TEXT,
    "category" "ShapeCategory" NOT NULL DEFAULT 'BASIC',
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Shape_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_companyId_idx" ON "Category"("companyId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Series_companyId_idx" ON "Series"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Shape_code_key" ON "Shape"("code");

-- CreateIndex
CREATE INDEX "Shape_category_idx" ON "Shape"("category");

-- CreateIndex
CREATE INDEX "Shape_isActive_sortOrder_idx" ON "Shape"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SceneItem_modelId_idx" ON "SceneItem"("modelId");

-- AddForeignKey
ALTER TABLE "ARModel" ADD CONSTRAINT "ARModel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ARModel" ADD CONSTRAINT "ARModel_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
