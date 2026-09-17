import { prisma } from "@/lib/prisma";

export async function listCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { teachings: { where: { teaching: { status: "PUBLISHED" } } } },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    order: category.order,
    teachingCount: category._count.teachings,
  }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}
