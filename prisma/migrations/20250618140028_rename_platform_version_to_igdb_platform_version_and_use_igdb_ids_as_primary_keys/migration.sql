/*
  Warnings:

  - The primary key for the `IgdbCompany` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `IgdbCompany` table. All the data in the column will be lost.
  - The primary key for the `IgdbPlatform` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `IgdbPlatform` table. All the data in the column will be lost.
  - You are about to drop the `PlatformVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "IgdbCompany_igdbId_key";

-- DropIndex
DROP INDEX "IgdbPlatform_igdbId_key";

-- AlterTable
ALTER TABLE "IgdbCompany" DROP CONSTRAINT "IgdbCompany_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "IgdbCompany_pkey" PRIMARY KEY ("igdbId");

-- AlterTable
ALTER TABLE "IgdbPlatform" DROP CONSTRAINT "IgdbPlatform_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "IgdbPlatform_pkey" PRIMARY KEY ("igdbId");

-- DropTable
DROP TABLE "PlatformVersion";

-- CreateTable
CREATE TABLE "IgdbPlatformVersion" (
    "igdbId" INTEGER NOT NULL,
    "checksum" TEXT,
    "companies" TEXT,
    "connectivity" TEXT,
    "cpu" TEXT,
    "graphics" TEXT,
    "main_manufacturer" INTEGER,
    "media" TEXT,
    "memory" TEXT,
    "name" TEXT NOT NULL,
    "os" TEXT,
    "output" TEXT,
    "platform_logo" INTEGER,
    "platform_version_release_dates" TEXT,
    "resolutions" TEXT,
    "slug" TEXT,
    "sound" TEXT,
    "storage" TEXT,
    "summary" TEXT,
    "url" TEXT,
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgdbPlatformVersion_pkey" PRIMARY KEY ("igdbId")
);
