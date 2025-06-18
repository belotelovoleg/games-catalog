-- DropForeignKey
ALTER TABLE "IgdbPlatform" DROP CONSTRAINT "IgdbPlatform_platform_family_fkey";

-- DropForeignKey
ALTER TABLE "IgdbPlatform" DROP CONSTRAINT "IgdbPlatform_platform_logo_fkey";

-- DropForeignKey
ALTER TABLE "IgdbPlatform" DROP CONSTRAINT "IgdbPlatform_platform_type_fkey";

-- DropForeignKey
ALTER TABLE "IgdbPlatformVersion" DROP CONSTRAINT "IgdbPlatformVersion_main_manufacturer_fkey";

-- DropForeignKey
ALTER TABLE "IgdbPlatformVersion" DROP CONSTRAINT "IgdbPlatformVersion_platform_logo_fkey";
