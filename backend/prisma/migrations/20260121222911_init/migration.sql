-- CreateEnum
CREATE TYPE "TextureType" AS ENUM ('SIMPLE', 'PBR');

-- AlterTable
ALTER TABLE "FloorTexture" ADD COLUMN     "aoIntensity" DOUBLE PRECISION DEFAULT 1.2,
ADD COLUMN     "aoUrl" TEXT,
ADD COLUMN     "baseColorUrl" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "defaultScale" DOUBLE PRECISION DEFAULT 2.0,
ADD COLUMN     "metallicUrl" TEXT,
ADD COLUMN     "metalnessValue" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "normalScale" DOUBLE PRECISION DEFAULT 2.0,
ADD COLUMN     "normalUrl" TEXT,
ADD COLUMN     "roughnessUrl" TEXT,
ADD COLUMN     "roughnessValue" DOUBLE PRECISION DEFAULT 0.9,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "TextureType" NOT NULL DEFAULT 'SIMPLE',
ALTER COLUMN "textureUrl" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FloorTexture_type_isActive_idx" ON "FloorTexture"("type", "isActive");

-- CreateIndex
CREATE INDEX "FloorTexture_category_idx" ON "FloorTexture"("category");
