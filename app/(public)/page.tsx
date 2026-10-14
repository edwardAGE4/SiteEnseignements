import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Hero } from "@/components/public/home/Hero";
import { HALO, HomeSection, sideFor } from "@/components/public/home/HomeSection";
import { RevealOnScroll } from "@/components/public/home/RevealOnScroll";
import { ResourceFamilies } from "@/components/public/home/ResourceFamilies";
import { AudioHighlights } from "@/components/public/home/AudioHighlights";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { getLatestResources, getSectionSummaries } from "@/lib/resources";
import { SECTIONS } from "@/lib/sections";
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

export default async function HomePage() {
  const [summaries, latest, audios, videos, books, files] = await Promise.all([
    getSectionSummaries(),
    getLatestResources(3),
    getLatestResources(3, { section: "audios", featuredFirst: true }),
    getLatestResources(3, { section: "videos", featuredFirst: true }),
    getLatestResources(4, { section: "livres", featuredFirst: true }),
    getLatestResources(4, { section: "fichiers-pratiques", featuredFirst: true }),
  ]);

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

  // rubriques non vides ; fond ivoire / blanc et titre gauche / droite alternes
  // (index 0 = "Les ressources", 1 = "Nouveautés", puis ces rubriques)
  const typed = [
    {
      key: "audios",
      eyebrow: "À écouter",
      items: audios,
      content: <AudioHighlights audios={audios} />,
    },
    { key: "videos", eyebrow: "À regarder", items: videos, content: <ResourceGrid resources={videos} section="videos" /> },
    {
      key: "livres",
      eyebrow: "À lire",
      items: books,
      content: <ResourceGrid resources={books} section="livres" columns={4} />,
    },
    {
      key: "fichiers-pratiques",
      eyebrow: "À télécharger",
      items: files,
      content: <ResourceGrid resources={files} section="fichiers-pratiques" />,
    },
  ] as const;
  const visible = typed.filter((entry) => entry.items.length > 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <RevealOnScroll />
      <Hero />

      <ResourceFamilies summaries={summaries} />

      <HomeSection halo={HALO.nouveautes} side={sideFor(1)}>
        <SectionHeading
          align={sideFor(1)}
          centerText
          centerTitle
          eyebrow="Nouveautés"
          title="Dernières publications"
          action={latest.length > 0 ? { href: "/recherche", label: "Toutes les ressources" } : undefined}
        />
        <div className="mt-12">
          <ResourceGrid
            resources={latest}
            showType
            emptyTitle="Les premières ressources arrivent bientôt"
            emptyDescription="Du contenu utile, édifiant et pratique est ajouté régulièrement. Revenez prochainement."
          />
        </div>
      </HomeSection>

      {visible.map((entry, index) => {
        const section = SECTIONS[entry.key];
        const side = sideFor(index + 2);
        return (
          <HomeSection key={entry.key} tone={index % 2 === 0 ? "white" : "ivory"} halo={HALO[entry.key]} side={side}>
            <SectionHeading
              align={side}
              centerText
              centerTitle
              eyebrow={entry.eyebrow}
              title={section.label}
              description={section.description}
              action={{ href: section.path, label: section.allLabel }}
            />
            <div className="mt-12">{entry.content}</div>
          </HomeSection>
        );
      })}
    </>
  );
}
