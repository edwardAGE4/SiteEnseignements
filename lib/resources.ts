import { prisma } from "@/lib/prisma";
import type { Prisma, ResourceType } from "@/generated/prisma/client";
import { SECTION_LIST, SECTIONS, TYPE_TO_SECTION, type ResourceSort, type Section } from "@/lib/sections";

export * from "@/lib/sections";

/**
 * Ressources rattachees a une rubrique. Une ressource apparait dans sa rubrique
 * principale, et aussi dans Audios / Videos si elle contient ce media
 * (ex. un enseignement video qui a aussi une version Spotify).
 */
function sectionWhere(section: Section): Prisma.TeachingWhereInput {
  switch (section) {
    case "audios":
      return { OR: [{ type: "AUDIO" }, { audioUrl: { not: null } }, { spotifyUrl: { not: null } }] };
    case "videos":
      return { OR: [{ type: "VIDEO" }, { videoUrl: { not: null } }] };
    case "livres":
      return { type: "BOOK" };
    case "fichiers-pratiques":
      return { type: "FILE" };
  }
}

/** Vrai si la ressource peut etre affichee dans cette rubrique. */
export function isInSection(
  resource: { type: ResourceType; audioUrl: string | null; spotifyUrl: string | null; videoUrl: string | null },
  section: Section,
): boolean {
  if (TYPE_TO_SECTION[resource.type] === section) return true;
  if (section === "audios") return Boolean(resource.audioUrl || resource.spotifyUrl);
  if (section === "videos") return Boolean(resource.videoUrl);
  return false;
}

/* ------------------------------------------------------------------ */
/* Requetes publiques                                                  */
/* ------------------------------------------------------------------ */

export const PAGE_SIZE = 12;

/** Ressource visible publiquement : publiee, et date de publication atteinte. */
function publicWhere(): Prisma.TeachingWhereInput {
  return {
    status: "PUBLISHED",
    OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  };
}

/** Chaque mot doit apparaitre dans au moins un champ (titre, description, tags, categorie...). */
function searchWhere(query: string): Prisma.TeachingWhereInput[] {
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  return words.map((word) => ({
    OR: [
      { title: { contains: word, mode: "insensitive" } },
      { excerpt: { contains: word, mode: "insensitive" } },
      { description: { contains: word, mode: "insensitive" } },
      { series: { contains: word, mode: "insensitive" } },
      { author: { contains: word, mode: "insensitive" } },
      { subtitle: { contains: word, mode: "insensitive" } },
      { tags: { has: word.toLowerCase() } },
      { categories: { some: { category: { name: { contains: word, mode: "insensitive" } } } } },
      { documents: { some: { fileName: { contains: word, mode: "insensitive" } } } },
    ],
  }));
}

function orderByFor(sort: ResourceSort): Prisma.TeachingOrderByWithRelationInput[] {
  switch (sort) {
    case "ancien":
      return [{ publishedAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }];
    case "alpha":
      return [{ title: "asc" }];
    case "popular":
      return [{ viewCount: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }];
    case "recent":
    default:
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  }
}

/** Champs necessaires aux cartes de ressources. */
export const resourceCardInclude = {
  categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
  documents: { orderBy: { order: "asc" }, select: { id: true, fileName: true, mimeType: true, sizeBytes: true } },
} satisfies Prisma.TeachingInclude;

export type ResourceCardData = Prisma.TeachingGetPayload<{ include: typeof resourceCardInclude }>;

export type ResourceListParams = {
  section?: Section;
  types?: ResourceType[];
  query?: string;
  categorySlugs?: string[];
  series?: string;
  /** uniquement les ressources rattachees a aucune categorie */
  uncategorized?: boolean;
  sort?: ResourceSort;
  page?: number;
  pageSize?: number;
};

export async function listResources(params: ResourceListParams) {
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const and: Prisma.TeachingWhereInput[] = [publicWhere()];

  if (params.section) and.push(sectionWhere(params.section));
  if (params.types?.length) and.push({ OR: params.types.map((type) => sectionWhere(TYPE_TO_SECTION[type])) });
  if (params.query?.trim()) and.push(...searchWhere(params.query));
  if (params.categorySlugs?.length) {
    and.push({ categories: { some: { category: { slug: { in: params.categorySlugs } } } } });
  }
  if (params.series) and.push({ series: params.series });
  if (params.uncategorized) and.push({ categories: { none: {} } });

  const where: Prisma.TeachingWhereInput = { AND: and };

  const [items, total] = await Promise.all([
    prisma.teaching.findMany({
      where,
      orderBy: orderByFor(params.sort ?? "recent"),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: resourceCardInclude,
    }),
    prisma.teaching.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Dernieres ressources publiees (toutes rubriques ou une seule). Les ressources mises en avant passent en premier si demande. */
export async function getLatestResources(take: number, options: { section?: Section; featuredFirst?: boolean } = {}) {
  const and: Prisma.TeachingWhereInput[] = [publicWhere()];
  if (options.section) and.push(sectionWhere(options.section));

  return prisma.teaching.findMany({
    where: { AND: and },
    orderBy: [
      ...(options.featuredFirst ? [{ featured: "desc" as const }] : []),
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take,
    include: resourceCardInclude,
  });
}

const resourceDetailInclude = {
  categories: { include: { category: true } },
  documents: { orderBy: { order: "asc" } },
} satisfies Prisma.TeachingInclude;

export type ResourceDetailData = Prisma.TeachingGetPayload<{ include: typeof resourceDetailInclude }>;

/** Ressource publique par slug (null si brouillon, archivee ou programmee). */
export async function getPublicResourceBySlug(slug: string) {
  return prisma.teaching.findFirst({
    where: { AND: [{ slug }, publicWhere()] },
    include: resourceDetailInclude,
  });
}

/** Ressource quel que soit son statut (apercu dans l'administration). */
export async function getResourceForPreview(id: string) {
  return prisma.teaching.findUnique({ where: { id }, include: resourceDetailInclude });
}

/** Ressources de la meme rubrique, en privilegiant la meme serie puis les memes categories. */
export async function getRelatedResources(resource: ResourceDetailData, section: Section, take = 3) {
  const categoryIds = resource.categories.map((link) => link.categoryId);
  const base: Prisma.TeachingWhereInput[] = [publicWhere(), sectionWhere(section), { id: { not: resource.id } }];
  const affinity: Prisma.TeachingWhereInput[] = [
    ...(resource.series ? [{ series: resource.series }] : []),
    ...(categoryIds.length ? [{ categories: { some: { categoryId: { in: categoryIds } } } }] : []),
  ];

  const related = affinity.length
    ? await prisma.teaching.findMany({
        where: { AND: [...base, { OR: affinity }] },
        orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }],
        take,
        include: resourceCardInclude,
      })
    : [];

  if (related.length >= take) return related;

  // complement avec les plus recentes de la rubrique
  const filler = await prisma.teaching.findMany({
    where: { AND: [...base, { id: { notIn: related.map((item) => item.id) } }] },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }],
    take: take - related.length,
    include: resourceCardInclude,
  });
  return [...related, ...filler];
}

/** Series existantes dans une rubrique (pour le filtre "Serie"). */
export async function listSeries(section: Section): Promise<string[]> {
  const rows = await prisma.teaching.findMany({
    where: { AND: [publicWhere(), sectionWhere(section), { series: { not: null } }] },
    distinct: ["series"],
    select: { series: true },
    orderBy: { series: "asc" },
  });
  return rows.flatMap((row) => (row.series ? [row.series] : []));
}

/** Categories actives qui contiennent au moins une ressource publique (de la rubrique si precisee). */
export async function listCategoriesInUse(section?: Section) {
  const resourceWhere: Prisma.TeachingWhereInput = {
    AND: [publicWhere(), ...(section ? [sectionWhere(section)] : [])],
  };

  const categories = await prisma.category.findMany({
    where: { isActive: true, teachings: { some: { teaching: resourceWhere } } },
    orderBy: { order: "asc" },
    include: { _count: { select: { teachings: { where: { teaching: resourceWhere } } } } },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    resourceCount: category._count.teachings,
  }));
}

export const SHELF_SIZE = 12;

/**
 * Rangees par categorie (ordre de l'administration), avec les ressources les
 * plus recentes, pour une rubrique ou tous types confondus (sans `section`).
 * Les ressources sans categorie forment une derniere rangee « Autres ». Une
 * ressource a plusieurs categories apparait dans chacune.
 */
export async function listResourceShelves(section?: Section) {
  const categories = await listCategoriesInUse(section);

  const [shelves, others] = await Promise.all([
    Promise.all(
      categories.map(async (category) => {
        const { items, total } = await listResources({ section, categorySlugs: [category.slug], pageSize: SHELF_SIZE });
        return { id: category.slug, slug: category.slug as string | null, name: category.name, description: category.description, items, total };
      }),
    ),
    listResources({ section, uncategorized: true, pageSize: SHELF_SIZE }),
  ]);

  if (others.total > 0) {
    const allLabel = section ? SECTIONS[section].allLabel : "Toutes les ressources";
    shelves.push({
      id: "autres",
      slug: null,
      name: categories.length > 0 ? (section ? "Autres" : "Autres ressources") : allLabel,
      description: null,
      items: others.items,
      total: others.total,
    });
  }
  return shelves.filter((shelf) => shelf.total > 0);
}

/** Nombre de ressources publiques par rubrique + derniere couverture disponible. */
export async function getSectionSummaries() {
  return Promise.all(
    SECTION_LIST.map(async (config) => {
      const where: Prisma.TeachingWhereInput = { AND: [publicWhere(), sectionWhere(config.section)] };
      const [count, withCover] = await Promise.all([
        prisma.teaching.count({ where }),
        prisma.teaching.findFirst({
          where: { AND: [where, { coverImageUrl: { not: null } }] },
          orderBy: [{ featured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }],
          select: { coverImageUrl: true },
        }),
      ]);
      return { ...config, count, coverImageUrl: withCover?.coverImageUrl ?? null };
    }),
  );
}

/** Lit un parametre d'URL multi-valeurs ("foi,famille") en liste. */
export function parseListParam(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function parsePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? Math.min(page, 10_000) : 1;
}
