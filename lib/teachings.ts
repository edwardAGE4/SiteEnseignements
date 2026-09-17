import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 9;

export type TeachingFormat = "youtube" | "spotify" | "pdf";
export type TeachingSort = "recent" | "popular" | "alpha";

export type TeachingListParams = {
  query?: string;
  categorySlug?: string;
  format?: TeachingFormat;
  sort?: TeachingSort;
  page?: number;
};

function buildWhere({
  query,
  categorySlug,
  format,
}: Pick<TeachingListParams, "query" | "categorySlug" | "format">): Prisma.TeachingWhereInput {
  const where: Prisma.TeachingWhereInput = {
    status: "PUBLISHED",
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { tags: { has: query.toLowerCase() } },
    ];
  }

  if (categorySlug) {
    where.categories = {
      some: { category: { slug: categorySlug } },
    };
  }

  if (format === "youtube") where.youtubeUrl = { not: null };
  if (format === "spotify") where.spotifyUrl = { not: null };
  if (format === "pdf") where.pdfUrl = { not: null };

  return where;
}

function buildOrderBy(sort?: TeachingSort): Prisma.TeachingOrderByWithRelationInput {
  switch (sort) {
    case "popular":
      return { viewCount: "desc" };
    case "alpha":
      return { title: "asc" };
    case "recent":
    default:
      return { publishedAt: "desc" };
  }
}

export async function listTeachings(params: TeachingListParams) {
  const page = Math.max(1, params.page ?? 1);
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);

  const [items, total] = await Promise.all([
    prisma.teaching.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { categories: { include: { category: true } } },
    }),
    prisma.teaching.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getLatestTeachings(take = 3) {
  return prisma.teaching.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take,
    include: { categories: { include: { category: true } } },
  });
}

export async function getTeachingBySlug(slug: string) {
  return prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { categories: { include: { category: true } }, createdBy: true },
  });
}

export async function getRelatedTeachings(teachingId: string, categoryIds: string[], take = 3) {
  if (categoryIds.length === 0) {
    return prisma.teaching.findMany({
      where: { status: "PUBLISHED", id: { not: teachingId } },
      orderBy: { publishedAt: "desc" },
      take,
      include: { categories: { include: { category: true } } },
    });
  }

  return prisma.teaching.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: teachingId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    orderBy: { publishedAt: "desc" },
    take,
    include: { categories: { include: { category: true } } },
  });
}
