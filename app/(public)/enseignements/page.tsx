import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SearchAndFilters } from "@/components/public/SearchAndFilters";
import { TeachingGrid } from "@/components/public/TeachingGrid";
import { Pagination } from "@/components/public/Pagination";
import { listTeachings, parseFormats, parseListParam, type TeachingSort } from "@/lib/teachings";
import { listCategoriesWithCounts } from "@/lib/categories";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Enseignements",
  description: "Explorez la bibliothèque des enseignements du Pasteur Jean-Marc GNALI : vidéos, audios et documents.",
  alternates: { canonical: "/enseignements" },
};

type SearchParams = {
  q?: string;
  categorie?: string;
  format?: string;
  tri?: string;
  page?: string;
};

export default async function TeachingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  const [{ items, total, pageCount }, categories] = await Promise.all([
    listTeachings({
      query: params.q,
      categorySlugs: parseListParam(params.categorie),
      formats: parseFormats(params.format),
      sort: params.tri as TeachingSort | undefined,
      page,
    }),
    listCategoriesWithCounts(),
  ]);

  return (
    <div className="pt-32">
      <Container className="pb-16">
        <SectionHeading eyebrow="Bibliothèque" title="Tous les enseignements" />
        <p className="mx-auto mt-4 max-w-xl text-center text-ink-500">
          {total} enseignement{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}.
        </p>
      </Container>

      <Container className="pb-12">
        <Suspense fallback={null}>
          <SearchAndFilters categories={categories} />
        </Suspense>
      </Container>

      <Container className="pb-28">
        <TeachingGrid teachings={items} />
        <div className="mt-16">
          <Pagination
            page={page}
            pageCount={pageCount}
            basePath="/enseignements"
            searchParams={{
              q: params.q,
              categorie: params.categorie,
              format: params.format,
              tri: params.tri,
            }}
          />
        </div>
      </Container>
    </div>
  );
}
