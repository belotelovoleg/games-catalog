-- CreateTable
CREATE TABLE "IgdbImage" (
    "igdbId" INTEGER NOT NULL,
    "alpha_channel" BOOLEAN,
    "animated" BOOLEAN,
    "checksum" TEXT,
    "height" INTEGER,
    "image_id" TEXT,
    "url" TEXT,
    "width" INTEGER,
    "computed_url" TEXT,

    CONSTRAINT "IgdbImage_pkey" PRIMARY KEY ("igdbId")
);
