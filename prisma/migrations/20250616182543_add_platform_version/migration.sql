-- CreateTable
CREATE TABLE "PlatformVersion" (
    "id" SERIAL NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "summary" TEXT,
    "url" TEXT,
    "cpu" TEXT,
    "memory" TEXT,
    "media" TEXT,
    "connectivity" TEXT,
    "graphics" TEXT,
    "resolutions" TEXT,
    "sound" TEXT,
    "storage" TEXT,
    "os" TEXT,
    "output" TEXT,
    "parentPlatformId" INTEGER,
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformVersion_igdbId_key" ON "PlatformVersion"("igdbId");
