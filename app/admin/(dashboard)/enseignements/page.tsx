import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeachingRowActions } from "@/components/admin/TeachingRowActions";
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
      <div className="flex items-center justify-between">
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
        <EmptyState title="Aucun enseignement" description="Commencez par en creer un." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/10 bg-ivory-50">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-300">
                <th className="px-5 py-3 font-medium">Titre</th>
                <th className="px-5 py-3 font-medium">Categorie</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Vues</th>
                <th className="px-5 py-3 font-medium">Telech.</th>
                <th className="px-5 py-3 font-medium">J&apos;aime</th>
                <th className="px-5 py-3 font-medium">Auteur</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {teachings.map((teaching) => (
                <tr key={teaching.id}>
                  <td className="max-w-[240px] truncate px-5 py-4 font-medium text-navy-900">{teaching.title}</td>
                  <td className="px-5 py-4 text-ink-500">
                    {teaching.categories.map((c) => c.category.name).join(", ") || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={teaching.status} />
                  </td>
                  <td className="px-5 py-4 text-ink-500">{formatDate(teaching.publishedAt ?? teaching.createdAt)}</td>
                  <td className="px-5 py-4 text-ink-500">{teaching.viewCount}</td>
                  <td className="px-5 py-4 text-ink-500">{teaching.downloadCount}</td>
                  <td className="px-5 py-4 text-ink-500">{teaching._count.likes}</td>
                  <td className="px-5 py-4 text-ink-500">{teaching.createdBy.name}</td>
                  <td className="px-5 py-4">
                    <TeachingRowActions
                      id={teaching.id}
                      status={teaching.status}
                      onTogglePublish={toggleTeachingStatus}
                      onDelete={deleteTeaching}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
