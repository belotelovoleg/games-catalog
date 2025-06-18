-- CreateTable
CREATE TABLE "IgdbPlatformFamily" (
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "IgdbPlatformFamily_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbPlatformType" (
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "IgdbPlatformType_pkey" PRIMARY KEY ("igdbId")
);
