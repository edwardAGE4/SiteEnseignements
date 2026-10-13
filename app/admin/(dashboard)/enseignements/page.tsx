import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { TeachingTable } from "@/components/admin/TeachingTable";
import { formatDate, cn } from "@/lib/utils";
import { isResourceType, RESOURCE_TYPES, resourcePath, TYPE_LABELS } from "@/lib/sections";
import { STATUS_LABELS } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Ressources",
  robots: { index: false, follow: false },
};

const STATUSES = ["PUBLISHED", "DRAFT", "ARCHIVED"] as const;
type StatusFilter = (typeof STATUSES)[number];

function filterHref(type: string | undefined, status: string | undefined) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("statut", status);
  const query = params.toString();
  return query ? `/admin/enseignements?${query}` : "/admin/enseignements";
}

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; statut?: string }>;
}) {
  const params = await searchParams;
  const type = isResourceType(params.type) ? params.type : undefined;
  const status = (STATUSES as readonly string[]).includes(params.statut ?? "") ? (params.statut as StatusFilter) : undefined;

  const where: Prisma.TeachingWhereInput = { ...(type ? { type } : {}), ...(status ? { status } : {}) };

  const [teachings, typeCounts] = await Promise.all([
    prisma.teaching.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        categories: { include: { category: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.teaching.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);

  const countFor = (value: string) => typeCounts.find((row) => row.type === value)?._count._all ?? 0;
  const total = typeCounts.reduce((sum, row) => sum + row._count._all, 0);
  const pill = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
      active ? "bg-navy-900 text-ivory-100" : "bg-ivory-50 text-ink-700 ring-1 ring-ink-900/10 hover:ring-navy-900",
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Ressources</h1>
          <p className="mt-1 text-sm text-ink-500">Audios, vidéos, livres et fichiers pratiques.</p>
        </div>
        <Link
          href={type ? `/admin/enseignements/nouveau?type=${type}` : "/admin/enseignements/nouveau"}
          className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-ivory-100 hover:bg-navy-700"
        >
          + Nouvelle ressource
        </Link>
      </div>

      <nav aria-label="Filtrer par type" className="flex gap-2 overflow-x-auto pb-1">
        <Link href={filterHref(undefined, status)} className={pill(!type)} aria-current={!type ? "page" : undefined}>
          Toutes ({total})
        </Link>
        {RESOURCE_TYPES.map((value) => (
          <Link key={value} href={filterHref(value, status)} className={pill(type === value)} aria-current={type === value ? "page" : undefined}>
            {TYPE_LABELS[value]} ({countFor(value)})
          </Link>
        ))}
      </nav>

      <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2 text-sm">
        <span className="py-1 text-ink-500">Statut :</span>
        <Link href={filterHref(type, undefined)} className={cn("rounded-full px-3 py-1", !status ? "bg-gold-100 font-semibold text-navy-900" : "text-ink-700 hover:underline")}>
          Tous
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={filterHref(type, value)}
            className={cn("rounded-full px-3 py-1", status === value ? "bg-gold-100 font-semibold text-navy-900" : "text-ink-700 hover:underline")}
          >
            {STATUS_LABELS[value]}
          </Link>
        ))}
      </nav>

      {teachings.length === 0 ? (
        <EmptyState
          title="Aucune ressource"
          description={type || status ? "Aucune ressource ne correspond à ces filtres." : "Commencez par en créer une."}
        />
      ) : (
        <TeachingTable
          teachings={teachings.map((teaching) => ({
            id: teaching.id,
            title: teaching.title,
            slug: teaching.slug,
            type: teaching.type,
            typeLabel: TYPE_LABELS[teaching.type],
            publicPath: resourcePath(teaching),
            status: teaching.status,
            featured: teaching.featured,
            categories: teaching.categories.map((c) => c.category.name).join(", "),
            tags: teaching.tags,
            date: formatDate(teaching.publishedAt ?? teaching.createdAt),
            viewCount: teaching.viewCount,
            downloadCount: teaching.downloadCount,
            likeCount: teaching._count.likes,
            author: teaching.createdBy.name,
          }))}
        />
      )}
    </div>
  );
}
