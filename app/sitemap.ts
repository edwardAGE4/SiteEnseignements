import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { resourcePath, SECTION_LIST } from "@/lib/sections";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [resources, categories] = await Promise.all([
    prisma.teaching.findMany({
      where: { status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
      select: { slug: true, type: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, teachings: { some: { teaching: { status: "PUBLISHED" } } } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/a-propos`, changeFrequency: "monthly", priority: 0.6 },
    ...SECTION_LIST.map((section) => ({
      url: `${siteUrl}${section.path}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.5 },
  ];

  // une seule URL (canonique) par ressource : celle de sa rubrique principale
  const resourceEntries: MetadataRoute.Sitemap = resources.map((resource) => ({
    url: `${siteUrl}${resourcePath(resource)}`,
    lastModified: resource.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...resourceEntries, ...categoryEntries];
}
