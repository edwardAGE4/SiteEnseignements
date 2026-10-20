import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { LibraryFilters } from "@/components/public/LibraryFilters";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { Pagination } from "@/components/public/Pagination";
import { ResourceShelves } from "@/components/public/ResourceShelves";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCategoriesInUse, listResourceShelves, listResources, listSeries, parsePage, parseSort } from "@/lib/resources";
import { SECTIONS, type Section } from "@/lib/sections";
import { SITE_NAME } from "@/lib/site";

export type LibrarySearchParams = {
  q?: string;
  categorie?: string;
  serie?: string;
  tri?: string;
  page?: string;
};

const PLACEHOLDERS: Record<Section, string> = {
  audios: "Rechercher un audio (titre, mot-clé…)",
  videos: "Rechercher une vidéo (titre, mot-clé…)",
  livres: "Rechercher un livre (titre, auteur…)",
  "fichiers-pratiques": "Rechercher un fichier (titre, format…)",
};

export function libraryMetadata(section: Section, params: LibrarySearchParams): Metadata {
  const config = SECTIONS[section];
  const filtered = Boolean(params.q || params.categorie || params.serie || params.tri || params.page);
  return {
    title: config.label,
    description: `${config.description} Ressources gratuites proposées par ${SITE_NAME}.`,
    alternates: { canonical: config.path },
    // les variantes filtrees ne sont pas indexees (contenu duplique)
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: `${config.label} — ${SITE_NAME}`, description: config.description, url: config.path },
  };
}

/**
 * Bibliotheque d'une rubrique. Sans recherche ni filtre : rangees par categorie
 * (« Tout voir » ouvre la liste filtree). Sinon : grille, tri et pagination.
 */
export async function LibraryPage({ section, params }: { section: Section; params: LibrarySearchParams }) {
  const config = SECTIONS[section];
  const browsing = !(params.q || params.categorie || params.serie || params.tri || params.page);

  if (browsing) {
    const [shelves, categories, series] = await Promise.all([
      listResourceShelves(section),
      listCategoriesInUse(section),
      section === "audios" || section === "videos" ? listSeries(section) : Promise.resolve([]),
    ]);

    return (
      <>
        <LibraryHeader section={section} />
        <Container className="py-10 md:py-14">
          <Suspense fallback={null}>
            <LibraryFilters
              placeholder={PLACEHOLDERS[section]}
              categories={categories.map((category) => ({ value: category.slug, label: category.name }))}
              series={series}
            />
          </Suspense>
          <div className="mt-10">
            {shelves.length > 0 ? (
              <ResourceShelves shelves={shelves} section={section} />
            ) : (
              <EmptyState
                title={config.emptyTitle}
                description="De nouvelles ressources sont ajoutées régulièrement. Revenez bientôt."
              />
            )}
          </div>
        </Container>
      </>
    );
  }

  return <LibraryGrid section={section} params={params} />;
}

function LibraryHeader({ section }: { section: Section }) {
  const config = SECTIONS[section];
  return (
    <section className="border-b border-navy-900/10 bg-ivory-100">
      <Container className="pt-10 pb-12 md:pt-14 md:pb-16">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: config.label }]} />
        <SectionHeading as="h1" className="mt-8" eyebrow="Bibliothèque" title={config.label} description={config.description} />
      </Container>
    </section>
  );
}

/** Liste filtree : recherche, filtres reels, tri, pagination. */
async function LibraryGrid({ section, params }: { section: Section; params: LibrarySearchParams }) {
  const config = SECTIONS[section];
  const page = parsePage(params.page);
  const sort = parseSort(params.tri);
  const categorySlug = params.categorie?.trim() || undefined;

  const [{ items, total, pageCount }, categories, series] = await Promise.all([
    listResources({
      section,
      query: params.q?.slice(0, 120),
      categorySlugs: categorySlug ? [categorySlug] : undefined,
      series: params.serie || undefined,
      sort,
      page,
    }),
    listCategoriesInUse(section),
    section === "audios" || section === "videos" ? listSeries(section) : Promise.resolve([]),
  ]);

  const filtered = Boolean(params.q || categorySlug || params.serie);

  return (
    <>
      <LibraryHeader section={section} />

      <Container className="py-10 md:py-14">
        <Suspense fallback={null}>
          <LibraryFilters
            placeholder={PLACEHOLDERS[section]}
            categories={categories.map((category) => ({ value: category.slug, label: category.name }))}
            series={series}
          />
        </Suspense>

        <p className="mt-8 text-sm text-ink-500" role="status">
          {total === 0
            ? "Aucun résultat"
            : `${total} ${total > 1 ? "ressources" : "ressource"}${filtered ? " trouvée" + (total > 1 ? "s" : "") : " disponible" + (total > 1 ? "s" : "")}`}
          {pageCount > 1 ? ` · page ${page} sur ${pageCount}` : ""}
        </p>

        <div className="mt-6">
          <ResourceGrid
            resources={items}
            section={section}
            emptyTitle={filtered ? "Aucun résultat pour cette recherche" : config.emptyTitle}
            emptyDescription={
              filtered
                ? "Essayez un autre mot-clé ou retirez un filtre."
                : "De nouvelles ressources sont ajoutées régulièrement. Revenez bientôt."
            }
          />
        </div>

        <div className="mt-14">
          <Pagination
            page={page}
            pageCount={pageCount}
            basePath={config.path}
            searchParams={{ q: params.q, categorie: categorySlug, serie: params.serie, tri: params.tri }}
          />
        </div>
      </Container>
    </>
  );
}
