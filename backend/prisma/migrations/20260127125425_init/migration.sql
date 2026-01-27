/*
  Warnings:

  - Made the column `thumbnailUrl` on table `FloorTexture` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FloorTexture" ALTER COLUMN "thumbnailUrl" SET NOT NULL;
