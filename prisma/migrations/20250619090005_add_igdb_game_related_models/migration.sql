-- CreateTable
CREATE TABLE "IgdbAgeRatingCategories" (
    "igdbId" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,

    CONSTRAINT "IgdbAgeRatingCategories_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbAgeRatings" (
    "igdbId" INTEGER NOT NULL,
    "rating_category" INTEGER,
    "rating_cover_url" TEXT,

    CONSTRAINT "IgdbAgeRatings_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbAlternativeNames" (
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "game" INTEGER,

    CONSTRAINT "IgdbAlternativeNames_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbCovers" (
    "igdbId" INTEGER NOT NULL,
    "game" INTEGER,
    "height" INTEGER,
    "image_id" TEXT,
    "url" TEXT,
    "width" INTEGER,

    CONSTRAINT "IgdbCovers_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbFranchises" (
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "IgdbFranchises_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbGameEngines" (
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "IgdbGameEngines_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbGameTypes" (
    "igdbId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "IgdbGameTypes_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbGenres" (
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "IgdbGenres_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbMultiplayerModes" (
    "igdbId" INTEGER NOT NULL,
    "lancoop" BOOLEAN,
    "offlinecoop" BOOLEAN,
    "offlinecoopmax" INTEGER,
    "offlinemax" INTEGER,
    "onlinecoop" BOOLEAN,
    "onlinecoopmax" INTEGER,
    "onlinemax" INTEGER,
    "splitscreen" BOOLEAN,
    "splitscreenonline" BOOLEAN,
    "game" INTEGER,

    CONSTRAINT "IgdbMultiplayerModes_pkey" PRIMARY KEY ("igdbId")
);

-- CreateTable
CREATE TABLE "IgdbScreenshots" (
    "igdbId" INTEGER NOT NULL,
    "height" INTEGER,
    "image_id" TEXT,
    "url" TEXT,
    "width" INTEGER,
    "game" INTEGER,

    CONSTRAINT "IgdbScreenshots_pkey" PRIMARY KEY ("igdbId")
);
