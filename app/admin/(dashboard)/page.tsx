import type { Metadata } from "next";
import Link from "next/link";
import { StatsCard } from "@/components/admin/StatsCard";
import { StatusBadge } from "@/components/ui/Badge";
import { TypeIcon } from "@/components/ui/Icons";
import { getDashboardStats } from "@/lib/admin-stats";
import { SECTION_LIST, TYPE_LABELS } from "@/lib/sections";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-medium text-navy-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ink-500">Vue d&apos;ensemble de l&apos;espace média.</p>
      </div>

      <section aria-label="Raccourcis de création">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Ajouter</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SECTION_LIST.map((section) => (
            <Link
              key={section.type}
              href={`/admin/enseignements/nouveau?type=${section.type}`}
              className="flex items-center gap-3 rounded-2xl border border-ink-900/10 bg-ivory-50 p-4 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300">
                <TypeIcon type={section.type} className="h-4 w-4" />
              </span>
              + {section.singular}
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Indicateurs">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatsCard label="Publiées" value={stats.published} href="/admin/enseignements?statut=PUBLISHED" />
          <StatsCard label="Brouillons" value={stats.drafts} href="/admin/enseignements?statut=DRAFT" />
          <StatsCard label="Audios publiés" value={stats.audios} href="/admin/enseignements?type=AUDIO" />
          <StatsCard label="Vidéos publiées" value={stats.videos} href="/admin/enseignements?type=VIDEO" />
          <StatsCard label="Livres publiés" value={stats.books} href="/admin/enseignements?type=BOOK" />
          <StatsCard label="Fichiers publiés" value={stats.files} href="/admin/enseignements?type=FILE" />
        </div>
        <p className="mt-3 text-xs text-ink-500">
          {stats.archived} archivée(s) · {stats.totalCategories} catégorie(s) · {stats.totalViews} vue(s) ·{" "}
          {stats.totalDownloads} consultation(s) ou téléchargement(s) de fichiers
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
          <h2 className="font-display text-lg font-medium text-navy-900">Les plus consultées</h2>
          <ul className="mt-4 divide-y divide-ink-900/10">
            {stats.topResources.map((resource, index) => (
              <li key={resource.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-data text-xs text-ink-500">{index + 1}</span>
                  <Link href={`/admin/enseignements/${resource.id}/modifier`} className="truncate text-sm font-medium text-navy-900 hover:text-gold-700">
                    {resource.title}
                  </Link>
                </div>
                <span className="shrink-0 font-data text-xs text-ink-500">
                  {TYPE_LABELS[resource.type]} · {resource.viewCount} vues
                </span>
              </li>
            ))}
            {stats.topResources.length === 0 ? <li className="py-3 text-sm text-ink-500">Aucune ressource publiée pour le moment.</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
          <h2 className="font-display text-lg font-medium text-navy-900">Activité récente</h2>
          <ul className="mt-4 divide-y divide-ink-900/10">
            {stats.recentResources.map((resource) => (
              <li key={resource.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link href={`/admin/enseignements/${resource.id}/modifier`} className="block truncate text-sm font-medium text-navy-900 hover:underline">
                    {resource.title}
                  </Link>
                  <p className="font-data text-xs text-ink-500">
                    {TYPE_LABELS[resource.type]} · {resource.createdBy.name} · {formatDate(resource.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={resource.status} />
              </li>
            ))}
            {stats.recentResources.length === 0 ? <li className="py-3 text-sm text-ink-500">Aucune activité pour le moment.</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
