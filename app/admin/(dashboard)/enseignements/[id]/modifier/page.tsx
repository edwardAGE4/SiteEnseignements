import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TeachingForm } from "@/components/admin/TeachingForm";
import { updateTeaching } from "../../actions";

export const metadata: Metadata = {
  title: "Modifier l'enseignement",
  robots: { index: false, follow: false },
};

export default async function EditTeachingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [teaching, categories] = await Promise.all([
    prisma.teaching.findUnique({
      where: { id },
      include: { categories: true },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!teaching) notFound();

  const boundUpdate = updateTeaching.bind(null, teaching.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Modifier l&apos;enseignement</h1>
          <p className="mt-1 text-sm text-ink-500">{teaching.title}</p>
        </div>
        {teaching.status === "PUBLISHED" ? (
          <Link
            href={`/enseignements/${teaching.slug}`}
            target="_blank"
            className="font-data text-sm text-navy-900 hover:underline"
          >
            Voir la fiche publique →
          </Link>
        ) : null}
      </div>

      <TeachingForm
        categories={categories}
        action={boundUpdate}
        submitLabel="Enregistrer les modifications"
        defaults={{
          title: teaching.title,
          slug: teaching.slug,
          description: teaching.description,
          youtubeUrl: teaching.youtubeUrl ?? "",
          spotifyUrl: teaching.spotifyUrl ?? "",
          pdfUrl: teaching.pdfUrl ?? "",
          pdfFileName: teaching.pdfFileName ?? "",
          coverImageUrl: teaching.coverImageUrl ?? "",
          tags: teaching.tags.join(", "),
          status: teaching.status,
          categoryIds: teaching.categories.map((c) => c.categoryId),
        }}
      />
    </div>
  );
}
