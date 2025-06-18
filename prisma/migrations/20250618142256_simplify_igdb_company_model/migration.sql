/*
  Warnings:

  - You are about to drop the column `change_date` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `change_date_category` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `changed_company_id` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `checksum` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `developed` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `parent` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `start_date_category` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `IgdbCompany` table. All the data in the column will be lost.
  - You are about to drop the column `websites` on the `IgdbCompany` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IgdbCompany" DROP COLUMN "change_date",
DROP COLUMN "change_date_category",
DROP COLUMN "changed_company_id",
DROP COLUMN "checksum",
DROP COLUMN "country",
DROP COLUMN "created_at",
DROP COLUMN "description",
DROP COLUMN "developed",
DROP COLUMN "logo",
DROP COLUMN "parent",
DROP COLUMN "published",
DROP COLUMN "slug",
DROP COLUMN "start_date",
DROP COLUMN "start_date_category",
DROP COLUMN "updated_at",
DROP COLUMN "url",
DROP COLUMN "websites";
