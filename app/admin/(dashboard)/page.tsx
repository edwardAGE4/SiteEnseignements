import type { Metadata } from "next";
import Link from "next/link";
import { StatsCard } from "@/components/admin/StatsCard";
import { StatusBadge } from "@/components/ui/Badge";
import { getDashboardStats } from "@/lib/admin-stats";
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
        <h1 className="font-display text-2xl font-semibold text-navy-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ink-500">Vue d&apos;ensemble de la plateforme.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatsCard label="Total enseignements" value={stats.totalTeachings} />
        <StatsCard label="Publies" value={stats.publishedTeachings} />
        <StatsCard label="Brouillons" value={stats.draftTeachings} />
        <StatsCard label="Vues" value={stats.totalViews} />
        <StatsCard label="Telechargements PDF" value={stats.totalDownloads} />
        <StatsCard label="Categories" value={stats.totalCategories} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900">Top 5 des enseignements</h2>
          <ul className="mt-4 divide-y divide-ink-900/10">
            {stats.topTeachings.map((teaching, index) => (
              <li key={teaching.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 truncate">
                  <span className="font-data text-xs text-ink-300">{index + 1}</span>
                  <Link href={`/admin/enseignements/${teaching.id}/modifier`} className="truncate text-sm font-medium text-navy-900 hover:text-gold-600">
                    {teaching.title}
                  </Link>
                </div>
                <span className="shrink-0 font-data text-xs text-ink-500">{teaching.viewCount} vues</span>
              </li>
            ))}
            {stats.topTeachings.length === 0 ? (
              <li className="py-3 text-sm text-ink-300">Aucun enseignement pour le moment.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900">Repartition par categorie</h2>
          <ul className="mt-4 divide-y divide-ink-900/10">
            {stats.categoryCounts.map((category) => (
              <li key={category.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-navy-900">{category.name}</span>
                <span className="font-data text-xs text-ink-500">{category._count.teachings}</span>
              </li>
            ))}
            {stats.categoryCounts.length === 0 ? (
              <li className="py-3 text-sm text-ink-300">Aucune categorie pour le moment.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-900">Activite recente</h2>
        <ul className="mt-4 divide-y divide-ink-900/10">
          {stats.recentTeachings.map((teaching) => (
            <li key={teaching.id} className="flex items-center justify-between gap-4 py-3">
              <div className="truncate">
                <p className="truncate text-sm font-medium text-navy-900">{teaching.title}</p>
                <p className="font-data text-xs text-ink-300">
                  {teaching.createdBy.name} · {formatDate(teaching.updatedAt)}
                </p>
              </div>
              <StatusBadge status={teaching.status} />
            </li>
          ))}
          {stats.recentTeachings.length === 0 ? (
            <li className="py-3 text-sm text-ink-300">Aucune activite pour le moment.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
