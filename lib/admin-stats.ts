import { prisma } from "@/lib/prisma";

/** Indicateurs du tableau de bord, calcules a partir des donnees reelles. */
export async function getDashboardStats() {
  const [byStatus, publishedByType, aggregates, totalCategories, topResources, recentResources] = await Promise.all([
    prisma.teaching.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.teaching.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
    prisma.teaching.aggregate({ _sum: { viewCount: true, downloadCount: true } }),
    prisma.category.count(),
    prisma.teaching.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, viewCount: true },
    }),
    prisma.teaching.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, type: true, status: true, updatedAt: true, createdBy: { select: { name: true } } },
    }),
  ]);

  const statusCount = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const typeCount = (type: string) => publishedByType.find((row) => row.type === type)?._count._all ?? 0;

  return {
    published: statusCount("PUBLISHED"),
    drafts: statusCount("DRAFT"),
    archived: statusCount("ARCHIVED"),
    audios: typeCount("AUDIO"),
    videos: typeCount("VIDEO"),
    books: typeCount("BOOK"),
    files: typeCount("FILE"),
    totalCategories,
    totalViews: aggregates._sum.viewCount ?? 0,
    totalDownloads: aggregates._sum.downloadCount ?? 0,
    topResources,
    recentResources,
  };
}
