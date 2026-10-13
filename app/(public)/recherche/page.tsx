import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { LibraryFilters } from "@/components/public/LibraryFilters";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { Pagination } from "@/components/public/Pagination";
import { listCategoriesInUse, listResources, parsePage, parseSort } from "@/lib/resources";
import { SECTIONS, type Section } from "@/lib/sections";

type SearchParams = { q?: string; type?: string; categorie?: string; tri?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: params.q ? `Recherche : ${params.q.slice(0, 60)}` : "Rechercher une ressource",
    description: "Recherchez parmi les audios, vidéos, livres et fichiers pratiques.",
    alternates: { canonical: "/recherche" },
    // les pages de resultats ne sont pas indexees
    robots: { index: false, follow: true },
  };
}

function parseSection(value: string | undefined): Section | undefined {
  return value && value in SECTIONS ? (value as Section) : undefined;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const section = parseSection(params.type);
  const categorySlug = params.categorie?.trim() || undefined;
  const page = parsePage(params.page);
  const hasCriteria = Boolean(query || section || categorySlug);

  const [{ items, total, pageCount }, categories] = await Promise.all([
    listResources({
      section,
      query,
      categorySlugs: categorySlug ? [categorySlug] : undefined,
      sort: parseSort(params.tri),
      page,
    }),
    listCategoriesInUse(),
  ]);

  return (
    <>
      <section className="border-b border-navy-900/10">
        <Container className="pt-10 pb-12 md:pt-14 md:pb-16">
          <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Recherche" }]} />
          <SectionHeading
            as="h1"
            className="mt-8"
            eyebrow="Recherche"
            title={query ? <>Résultats pour « {query} »</> : "Rechercher une ressource"}
            description="Retrouvez un audio, une vidéo, un livre ou un fichier pratique par titre, description, mot-clé, catégorie ou format."
          />
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <Suspense fallback={null}>
          <LibraryFilters
            placeholder="Titre, mot-clé, catégorie…"
            categories={categories.map((category) => ({ value: category.slug, label: category.name }))}
            showTypes
          />
        </Suspense>

        <p className="mt-8 text-sm text-ink-500" role="status">
          {total === 0 ? "Aucun résultat" : `${total} résultat${total > 1 ? "s" : ""}`}
          {pageCount > 1 ? ` · page ${page} sur ${pageCount}` : ""}
        </p>

        <div className="mt-6">
          <ResourceGrid
            resources={items}
            section={section}
            showType={!section}
            emptyTitle={hasCriteria ? "Aucune ressource ne correspond à votre recherche" : "Aucune ressource pour le moment"}
            emptyDescription={hasCriteria ? "Vérifiez l'orthographe, essayez un mot plus général ou retirez un filtre." : undefined}
          />
        </div>

        <div className="mt-14">
          <Pagination
            page={page}
            pageCount={pageCount}
            basePath="/recherche"
            searchParams={{ q: query || undefined, type: section, categorie: categorySlug, tri: params.tri }}
          />
        </div>
      </Container>
    </>
  );
}
