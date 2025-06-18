-- DropForeignKey
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_platformId_fkey";

-- DropForeignKey
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlatform" DROP CONSTRAINT "UserPlatform_platformId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlatform" DROP CONSTRAINT "UserPlatform_userId_fkey";
