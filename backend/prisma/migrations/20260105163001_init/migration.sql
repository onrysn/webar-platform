/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `UserCompany` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'EDITOR', 'MEMBER');

-- DropForeignKey
ALTER TABLE "UserCompany" DROP CONSTRAINT "UserCompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "UserCompany" DROP CONSTRAINT "UserCompany_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" INTEGER,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- DropTable
DROP TABLE "UserCompany";

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
