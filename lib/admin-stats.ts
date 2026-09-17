import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalTeachings,
    publishedTeachings,
    draftTeachings,
    totalCategories,
    aggregates,
    topTeachings,
    recentTeachings,
    categoryCounts,
  ] = await Promise.all([
    prisma.teaching.count(),
    prisma.teaching.count({ where: { status: "PUBLISHED" } }),
    prisma.teaching.count({ where: { status: "DRAFT" } }),
    prisma.category.count(),
    prisma.teaching.aggregate({ _sum: { viewCount: true, downloadCount: true } }),
    prisma.teaching.findMany({
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, viewCount: true, status: true },
    }),
    prisma.teaching.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true, updatedAt: true, createdBy: { select: { name: true } } },
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { teachings: true } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    totalTeachings,
    publishedTeachings,
    draftTeachings,
    totalCategories,
    totalViews: aggregates._sum.viewCount ?? 0,
    totalDownloads: aggregates._sum.downloadCount ?? 0,
    topTeachings,
    recentTeachings,
    categoryCounts,
  };
}
