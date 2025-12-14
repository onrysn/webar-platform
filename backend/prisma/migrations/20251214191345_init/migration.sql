/*
  Warnings:

  - You are about to drop the column `modelId` on the `ARScene` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `ARScene` table. All the data in the column will be lost.
  - You are about to drop the column `rotation` on the `ARScene` table. All the data in the column will be lost.
  - You are about to drop the column `scale` on the `ARScene` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ARScene` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ARScene" DROP CONSTRAINT "ARScene_modelId_fkey";

-- AlterTable
ALTER TABLE "ARScene" DROP COLUMN "modelId",
DROP COLUMN "position",
DROP COLUMN "rotation",
DROP COLUMN "scale",
ADD COLUMN     "settings" JSONB DEFAULT '{}',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SceneItem" (
    "id" SERIAL NOT NULL,
    "sceneId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "name" TEXT,
    "position" JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
    "rotation" JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
    "scale" JSONB NOT NULL DEFAULT '{"x": 1, "y": 1, "z": 1}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SceneItem" ADD CONSTRAINT "SceneItem_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "ARScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneItem" ADD CONSTRAINT "SceneItem_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ARModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
