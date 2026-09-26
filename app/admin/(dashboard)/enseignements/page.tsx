import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeachingTable } from "@/components/admin/TeachingTable";
import { formatDate } from "@/lib/utils";
import { deleteTeaching, toggleTeachingStatus } from "./actions";

export const metadata: Metadata = {
  title: "Enseignements",
  robots: { index: false, follow: false },
};

export default async function AdminTeachingsPage() {
  const teachings = await prisma.teaching.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      categories: { include: { category: true } },
      _count: { select: { likes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Enseignements</h1>
          <p className="mt-1 text-sm text-ink-500">{teachings.length} enseignement(s)</p>
        </div>
        <Link
          href="/admin/enseignements/nouveau"
          className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800"
        >
          + Nouvel enseignement
        </Link>
      </div>

      {teachings.length === 0 ? (
        <EmptyState title="Aucun enseignement" description="Commencez par en créer un." />
      ) : (
        <TeachingTable
          teachings={teachings.map((teaching) => ({
            id: teaching.id,
            title: teaching.title,
            slug: teaching.slug,
            status: teaching.status,
            categories: teaching.categories.map((c) => c.category.name).join(", "),
            tags: teaching.tags,
            date: formatDate(teaching.publishedAt ?? teaching.createdAt),
            viewCount: teaching.viewCount,
            downloadCount: teaching.downloadCount,
            likeCount: teaching._count.likes,
            author: teaching.createdBy.name,
          }))}
          onTogglePublish={toggleTeachingStatus}
          onDelete={deleteTeaching}
        />
      )}
    </div>
  );
}
