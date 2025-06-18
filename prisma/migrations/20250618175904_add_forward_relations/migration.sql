-- AddForeignKey
ALTER TABLE "IgdbPlatformVersion" ADD CONSTRAINT "IgdbPlatformVersion_platform_logo_fkey" FOREIGN KEY ("platform_logo") REFERENCES "IgdbPlatformLogo"("igdbId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgdbPlatformVersion" ADD CONSTRAINT "IgdbPlatformVersion_main_manufacturer_fkey" FOREIGN KEY ("main_manufacturer") REFERENCES "IgdbCompany"("igdbId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgdbPlatform" ADD CONSTRAINT "IgdbPlatform_platform_family_fkey" FOREIGN KEY ("platform_family") REFERENCES "IgdbPlatformFamily"("igdbId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgdbPlatform" ADD CONSTRAINT "IgdbPlatform_platform_type_fkey" FOREIGN KEY ("platform_type") REFERENCES "IgdbPlatformType"("igdbId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgdbPlatform" ADD CONSTRAINT "IgdbPlatform_platform_logo_fkey" FOREIGN KEY ("platform_logo") REFERENCES "IgdbPlatformLogo"("igdbId") ON DELETE SET NULL ON UPDATE CASCADE;
