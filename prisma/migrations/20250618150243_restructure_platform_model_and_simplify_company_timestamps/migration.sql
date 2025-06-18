/*
  Warnings:

  - You are about to drop the column `lastSynced` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `localCreatedAt` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `localUpdatedAt` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `connectivity` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `cpu` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `graphics` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `igdbId` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `media` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `memory` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `resolutions` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `sound` on the `Platform` table. All the data in the column will be lost.
  - You are about to drop the column `storage` on the `Platform` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Platform_igdbId_key";

-- AlterTable
ALTER TABLE "IgdbCompany" DROP COLUMN "lastSynced",
DROP COLUMN "localCreatedAt",
DROP COLUMN "localUpdatedAt";

-- AlterTable
ALTER TABLE "Platform" DROP COLUMN "connectivity",
DROP COLUMN "cpu",
DROP COLUMN "description",
DROP COLUMN "graphics",
DROP COLUMN "igdbId",
DROP COLUMN "imageUrl",
DROP COLUMN "media",
DROP COLUMN "memory",
DROP COLUMN "resolutions",
DROP COLUMN "sound",
DROP COLUMN "storage",
ADD COLUMN     "abbreviation" TEXT,
ADD COLUMN     "alternative_name" TEXT,
ADD COLUMN     "companies" TEXT,
ADD COLUMN     "generation" INTEGER,
ADD COLUMN     "igdbPlatformId" INTEGER,
ADD COLUMN     "igdbPlatformVersionId" INTEGER,
ADD COLUMN     "platform_logo_base64" TEXT,
ADD COLUMN     "versionName" TEXT;
