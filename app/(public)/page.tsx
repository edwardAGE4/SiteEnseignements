import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Hero } from "@/components/public/home/Hero";
import { FormatShortcuts } from "@/components/public/home/FormatShortcuts";
import { ResourceShelves, type Shelf } from "@/components/public/ResourceShelves";
import { getLatestResources, getSectionSummaries, listResourceShelves, SHELF_SIZE } from "@/lib/resources";
import { getPortraitUrl } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 60;

const DESCRIPTION =
  "Je mets GRATUITEMENT à votre disposition un certain nombre de ressources multiformats : audios, vidéos, livres et fichiers pratiques.";

export async function generateMetadata(): Promise<Metadata> {
  const portrait = await getPortraitUrl().catch(() => null);
  return {
    title: { absolute: `${SITE_NAME} — Espace média` },
    description: DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      title: `${SITE_NAME} — Espace média`,
      description: DESCRIPTION,
      url: "/",
      images: portrait ? [{ url: portrait, alt: SITE_NAME }] : undefined,
    },
  };
}

/**
 * Accueil : hero, raccourcis par format, puis « Explorer par thème » (une
 * rangee de nouveautes, puis une rangee par categorie, tous formats melanges)
 * et un encart vers la page À propos.
 */
export default async function HomePage() {
  const [summaries, latest, categoryShelves] = await Promise.all([
    getSectionSummaries(),
    getLatestResources(SHELF_SIZE),
    listResourceShelves(),
  ]);

  const shelves: Shelf[] = [
    ...(latest.length > 0
      ? [
          {
            id: "nouveautes",
            slug: null,
            name: "Nouveautés",
            description: "Les derniers contenus ajoutés",
            items: latest,
            total: latest.length,
            href: "/recherche?tri=recent",
          },
        ]
      : []),
    ...categoryShelves,
  ];

  const siteUrl = getSiteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
      inLanguage: "fr",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/recherche?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    { "@context": "https://schema.org", "@type": "Person", name: SITE_NAME, url: `${siteUrl}/a-propos` },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Hero />
      <FormatShortcuts summaries={summaries} />

      {/* ancre du bouton « Explorer les ressources » du hero */}
      <section id="ressources" className="py-14 md:py-20">
        <Container>
          <SectionHeading eyebrow="Ressources" title="Explorer par thème" />
          <div className="mt-10 md:mt-12">
            {shelves.length > 0 ? (
              <ResourceShelves
                shelves={shelves}
                headingLevel="h3"
                // « Autres ressources » (sans categorie) : liste complete
                seeAllHref={(slug) => (slug ? `/categories/${slug}` : "/recherche?tri=recent")}
              />
            ) : (
              <EmptyState
                title="Les premières ressources arrivent bientôt"
                description="Du contenu utile, édifiant et pratique est ajouté régulièrement. Revenez prochainement."
              />
            )}
          </div>
        </Container>
      </section>

      <section className="border-b border-ivory-100/10 bg-navy-900">
        <Container className="flex flex-col items-start gap-5 py-12 md:flex-row md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="font-display text-2xl font-medium text-ivory-100 md:text-[1.7rem]">Qui est {SITE_NAME} ?</h2>
            <p className="mt-2 max-w-2xl text-[0.95rem] text-ivory-100/70">
              Découvrez son parcours, sa démarche et pourquoi il partage gratuitement ces ressources.
            </p>
          </div>
          <Link href="/a-propos" className={buttonClassName({ variant: "ghost", className: "shrink-0" })}>
            En savoir plus
          </Link>
        </Container>
      </section>
    </>
  );
}
