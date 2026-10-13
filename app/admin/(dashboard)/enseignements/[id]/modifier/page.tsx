import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { StatusBadge } from "@/components/ui/Badge";
import { getTeachingWarnings } from "@/lib/validations/teaching";
import { formatDuration } from "@/lib/media";
import { resourcePath, TYPE_LABELS } from "@/lib/sections";
import { toDateInputValue } from "@/lib/utils";
import { updateTeaching } from "../../actions";

export const metadata: Metadata = {
  title: "Modifier la ressource",
  robots: { index: false, follow: false },
};

export default async function EditResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ statut?: string }>;
}) {
  const { id } = await params;
  const { statut } = await searchParams;

  const [resource, categories] = await Promise.all([
    prisma.teaching.findUnique({
      where: { id },
      include: { categories: true, documents: { orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, isActive: true } }),
  ]);

  if (!resource) notFound();

  const boundUpdate = updateTeaching.bind(null, resource.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/enseignements" className="text-xs text-ink-500 hover:underline">
            ← Toutes les ressources
          </Link>
          <h1 className="mt-2 font-display text-2xl font-medium text-navy-900">Modifier : {resource.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
            <StatusBadge status={resource.status} />
            <span>{TYPE_LABELS[resource.type]}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href={`/admin/enseignements/${resource.id}/apercu`} className="font-medium text-navy-900 hover:underline">
            Prévisualiser
          </Link>
          {resource.status === "PUBLISHED" ? (
            <a href={resourcePath(resource)} target="_blank" rel="noreferrer" className="font-medium text-navy-900 hover:underline">
              Voir la fiche publique ↗
            </a>
          ) : null}
        </div>
      </div>

      <ResourceForm
        categories={categories}
        action={boundUpdate}
        isCreation={false}
        initialState={
          statut === "cree"
            ? { success: "La ressource a été créée avec succès.", warnings: getTeachingWarnings(resource) }
            : undefined
        }
        defaults={{
          type: resource.type,
          title: resource.title,
          slug: resource.slug,
          excerpt: resource.excerpt ?? "",
          description: resource.description,
          videoUrl: resource.videoUrl ?? "",
          spotifyUrl: resource.spotifyUrl ?? "",
          audioUrl: resource.audioUrl ?? "",
          duration: resource.durationSeconds ? formatDuration(resource.durationSeconds) : "",
          series: resource.series ?? "",
          subtitle: resource.subtitle ?? "",
          author: resource.author ?? "",
          isbn: resource.isbn ?? "",
          bookFormats: resource.bookFormats,
          readUrl: resource.readUrl ?? "",
          purchaseUrl: resource.purchaseUrl ?? "",
          downloadPolicy: resource.downloadPolicy,
          documents: resource.documents.map(({ id: docId, url, fileName, mimeType, sizeBytes }) => ({
            id: docId,
            url,
            fileName,
            mimeType,
            sizeBytes,
          })),
          coverImageUrl: resource.coverImageUrl ?? "",
          tags: resource.tags.join(", "),
          status: resource.status,
          featured: resource.featured,
          publishedAt: toDateInputValue(resource.publishedAt),
          seoTitle: resource.seoTitle ?? "",
          seoDescription: resource.seoDescription ?? "",
          categoryIds: resource.categories.map((c) => c.categoryId),
        }}
      />
    </div>
  );
}
