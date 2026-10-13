import { prisma } from "@/lib/prisma";

/** Categories avec le nombre de ressources rattachees (toutes et publiees), pour l'administration. */
export async function listCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { teachings: true } },
      teachings: { where: { teaching: { status: "PUBLISHED" } }, select: { teachingId: true } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    order: category.order,
    resourceCount: category._count.teachings,
    publishedCount: category.teachings.length,
  }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}
