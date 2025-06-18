/*
  Warnings:

  - You are about to drop the `IgdbImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "IgdbImage";

-- CreateTable
CREATE TABLE "IgdbPlatformLogo" (
    "igdbId" INTEGER NOT NULL,
    "alpha_channel" BOOLEAN,
    "animated" BOOLEAN,
    "checksum" TEXT,
    "height" INTEGER,
    "image_id" TEXT,
    "url" TEXT,
    "width" INTEGER,
    "computed_url" TEXT,

    CONSTRAINT "IgdbPlatformLogo_pkey" PRIMARY KEY ("igdbId")
);
