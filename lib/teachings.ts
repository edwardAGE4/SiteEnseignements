import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 9;

export const TEACHING_FORMATS = ["youtube", "spotify", "pdf"] as const;
export type TeachingFormat = (typeof TEACHING_FORMATS)[number];
export type TeachingSort = "recent" | "popular" | "alpha";

export type TeachingListParams = {
  query?: string;
  /** Enseignements appartenant a au moins une de ces categories. */
  categorySlugs?: string[];
  /** Enseignements disponibles dans au moins un de ces formats. */
  formats?: TeachingFormat[];
  sort?: TeachingSort;
  page?: number;
};

/** Lit un parametre d'URL multi-valeurs ("foi,famille") en liste. */
export function parseListParam(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseFormats(value: string | undefined): TeachingFormat[] {
  return parseListParam(value).filter((item): item is TeachingFormat =>
    (TEACHING_FORMATS as readonly string[]).includes(item),
  );
}

const FORMAT_CONDITIONS: Record<TeachingFormat, Prisma.TeachingWhereInput> = {
  youtube: { youtubeUrl: { not: null } },
  spotify: { spotifyUrl: { not: null } },
  pdf: { documents: { some: {} } },
};

function buildWhere({
  query,
  categorySlugs,
  formats,
}: Pick<TeachingListParams, "query" | "categorySlugs" | "formats">): Prisma.TeachingWhereInput {
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

  if (categorySlugs?.length) {
    where.categories = {
      some: { category: { slug: { in: categorySlugs } } },
    };
  }

  if (formats?.length) {
    where.AND = [{ OR: formats.map((format) => FORMAT_CONDITIONS[format]) }];
  }

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
    include: {
      categories: { include: { category: true } },
      createdBy: true,
      documents: { orderBy: { order: "asc" } },
    },
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
