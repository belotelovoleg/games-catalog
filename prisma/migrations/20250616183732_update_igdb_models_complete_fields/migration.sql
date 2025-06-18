/*
  Warnings:

  - You are about to drop the column `createdAt` on the `PlatformVersion` table. All the data in the column will be lost.
  - You are about to drop the column `parentPlatformId` on the `PlatformVersion` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PlatformVersion` table. All the data in the column will be lost.
  - Added the required column `localUpdatedAt` to the `PlatformVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlatformVersion" DROP COLUMN "createdAt",
DROP COLUMN "parentPlatformId",
DROP COLUMN "updatedAt",
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "companies" TEXT,
ADD COLUMN     "localCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "localUpdatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "main_manufacturer" INTEGER,
ADD COLUMN     "platform_logo" INTEGER,
ADD COLUMN     "platform_version_release_dates" TEXT;

-- CreateTable
CREATE TABLE "IgdbPlatform" (
    "id" SERIAL NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "abbreviation" TEXT,
    "alternative_name" TEXT,
    "category" INTEGER,
    "checksum" TEXT,
    "created_at" TIMESTAMP(3),
    "generation" INTEGER,
    "name" TEXT NOT NULL,
    "platform_family" INTEGER,
    "platform_logo" INTEGER,
    "platform_type" INTEGER,
    "slug" TEXT,
    "summary" TEXT,
    "updated_at" TIMESTAMP(3),
    "url" TEXT,
    "versions" TEXT,
    "websites" TEXT,
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgdbPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgdbPlatform_igdbId_key" ON "IgdbPlatform"("igdbId");
