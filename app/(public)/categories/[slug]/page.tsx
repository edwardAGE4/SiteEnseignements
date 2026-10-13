import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { Pagination } from "@/components/public/Pagination";
import { getCategoryBySlug } from "@/lib/categories";
import { listResources, parsePage } from "@/lib/resources";

export const revalidate = 60;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category || !category.isActive) return { title: "Thématique introuvable" };
  return {
    title: category.name,
    description: category.description ?? `Ressources de la thématique ${category.name}.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await getCategoryBySlug(slug);

  if (!category || !category.isActive) notFound();

  const page = parsePage(pageParam);
  const { items, total, pageCount } = await listResources({ categorySlugs: [slug], page });

  return (
    <Container className="pt-10 pb-24 md:pt-14">
      <Breadcrumbs
        items={[{ label: "Accueil", href: "/" }, { label: "Thématiques", href: "/categories" }, { label: category.name }]}
      />
      <SectionHeading
        as="h1"
        className="mt-8"
        eyebrow="Thématique"
        title={category.name}
        description={category.description ?? undefined}
      />
      <p className="mt-6 text-sm text-ink-500">
        {total} ressource{total > 1 ? "s" : ""}
      </p>

      <div className="mt-8">
        <ResourceGrid resources={items} showType emptyTitle="Aucune ressource dans cette thématique pour le moment" />
      </div>

      <div className="mt-14">
        <Pagination page={page} pageCount={pageCount} basePath={`/categories/${slug}`} searchParams={{}} />
      </div>
    </Container>
  );
}
