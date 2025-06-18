-- CreateTable
CREATE TABLE "IgdbCompany" (
    "id" SERIAL NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "change_date" TIMESTAMP(3),
    "change_date_category" INTEGER,
    "changed_company_id" INTEGER,
    "checksum" TEXT,
    "country" INTEGER,
    "created_at" TIMESTAMP(3),
    "description" TEXT,
    "developed" TEXT,
    "logo" INTEGER,
    "name" TEXT NOT NULL,
    "parent" INTEGER,
    "published" TEXT,
    "slug" TEXT,
    "start_date" TIMESTAMP(3),
    "start_date_category" INTEGER,
    "updated_at" TIMESTAMP(3),
    "url" TEXT,
    "websites" TEXT,
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IgdbCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgdbCompany_igdbId_key" ON "IgdbCompany"("igdbId");
