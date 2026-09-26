import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TeachingGrid } from "@/components/public/TeachingGrid";
import { Pagination } from "@/components/public/Pagination";
import { getCategoryBySlug } from "@/lib/categories";
import { listTeachings } from "@/lib/teachings";

export const revalidate = 30;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Enseignements de la catégorie ${category.name}.`,
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

  if (!category) notFound();

  const page = Number(pageParam ?? "1") || 1;
  const { items, total, pageCount } = await listTeachings({ categorySlugs: [slug], page });

  return (
    <div className="pt-32 pb-28">
      <Container>
        <SectionHeading eyebrow="Catégorie" title={category.name} />
        {category.description ? (
          <p className="mx-auto mt-4 max-w-2xl text-justify hyphens-auto text-ink-500 md:text-center">{category.description}</p>
        ) : null}
        <p className="mt-2 text-center font-data text-sm text-ink-300">
          {total} enseignement{total > 1 ? "s" : ""}
        </p>

        <div className="mt-16">
          <TeachingGrid teachings={items} />
        </div>

        <div className="mt-16">
          <Pagination page={page} pageCount={pageCount} basePath={`/categories/${slug}`} searchParams={{}} />
        </div>
      </Container>
    </div>
  );
}
