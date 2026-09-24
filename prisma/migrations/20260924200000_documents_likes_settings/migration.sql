-- CreateTable
CREATE TABLE "teaching_documents" (
    "id" TEXT NOT NULL,
    "teachingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teaching_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_likes" (
    "id" TEXT NOT NULL,
    "teachingId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "teaching_documents_teachingId_order_idx" ON "teaching_documents"("teachingId", "order");

-- CreateIndex
CREATE INDEX "media_likes_teachingId_target_idx" ON "media_likes"("teachingId", "target");

-- CreateIndex
CREATE UNIQUE INDEX "media_likes_teachingId_target_visitorId_key" ON "media_likes"("teachingId", "target", "visitorId");

-- AddForeignKey
ALTER TABLE "teaching_documents" ADD CONSTRAINT "teaching_documents_teachingId_fkey" FOREIGN KEY ("teachingId") REFERENCES "teachings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_likes" ADD CONSTRAINT "media_likes_teachingId_fkey" FOREIGN KEY ("teachingId") REFERENCES "teachings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprise des donnees : le PDF unique de chaque enseignement devient son premier document
INSERT INTO "teaching_documents" ("id", "teachingId", "url", "fileName", "order")
SELECT gen_random_uuid()::text, "id", "pdfUrl", COALESCE("pdfFileName", 'document.pdf'), 0
FROM "teachings"
WHERE "pdfUrl" IS NOT NULL;

-- AlterTable
ALTER TABLE "teachings" DROP COLUMN "pdfFileName",
DROP COLUMN "pdfUrl";
