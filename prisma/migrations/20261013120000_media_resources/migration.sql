-- Refonte "espace media" : la table teachings devient le modele unifie des
-- ressources (audios, videos, livres, fichiers pratiques).
-- Migration NON destructive : aucune colonne ni ligne n'est supprimee.

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'ARCHIVED';

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('AUDIO', 'VIDEO', 'BOOK', 'FILE');

-- CreateEnum
CREATE TYPE "DownloadPolicy" AS ENUM ('DOWNLOAD', 'VIEW_ONLY');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "teaching_documents" ADD COLUMN "mimeType" TEXT,
ADD COLUMN "sizeBytes" INTEGER;

-- AlterTable
ALTER TABLE "teachings" ADD COLUMN "type" "ResourceType" NOT NULL DEFAULT 'VIDEO',
ADD COLUMN "excerpt" TEXT,
ADD COLUMN "audioUrl" TEXT,
ADD COLUMN "durationSeconds" INTEGER,
ADD COLUMN "series" TEXT,
ADD COLUMN "subtitle" TEXT,
ADD COLUMN "author" TEXT,
ADD COLUMN "isbn" TEXT,
ADD COLUMN "bookFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "readUrl" TEXT,
ADD COLUMN "purchaseUrl" TEXT,
ADD COLUMN "downloadPolicy" "DownloadPolicy" NOT NULL DEFAULT 'DOWNLOAD',
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT;

-- Reprise des donnees : rubrique deduite des medias deja renseignes
-- (video YouTube > audio Spotify > documents seuls).
UPDATE "teachings" SET "type" = 'AUDIO'
WHERE "youtubeUrl" IS NULL AND "spotifyUrl" IS NOT NULL;

UPDATE "teachings" t SET "type" = 'FILE'
WHERE t."youtubeUrl" IS NULL AND t."spotifyUrl" IS NULL
  AND EXISTS (SELECT 1 FROM "teaching_documents" d WHERE d."teachingId" = t."id");

-- Type MIME des documents existants (tous des PDF jusqu'ici)
UPDATE "teaching_documents" SET "mimeType" = 'application/pdf' WHERE "mimeType" IS NULL;

-- CreateIndex
CREATE INDEX "teachings_type_status_publishedAt_idx" ON "teachings"("type", "status", "publishedAt");
