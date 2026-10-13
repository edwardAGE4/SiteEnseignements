import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Hero } from "@/components/public/home/Hero";
import { ResourceFamilies } from "@/components/public/home/ResourceFamilies";
import { AudioHighlights } from "@/components/public/home/AudioHighlights";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { getLatestResources, getSectionSummaries } from "@/lib/resources";
import { SECTIONS } from "@/lib/sections";
import { getPortraitUrl } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

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

function HomeSection({
  children,
  tone = "ivory",
  id,
}: {
  children: React.ReactNode;
  tone?: "ivory" | "white";
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-28", tone === "white" ? "bg-white" : "bg-ivory-100")}>
      <Container>{children}</Container>
    </section>
  );
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

  // sections alternees ivoire / blanc, uniquement pour les rubriques non vides
  const typed = [
    { key: "audios", items: audios },
    { key: "videos", items: videos },
    { key: "livres", items: books },
    { key: "fichiers-pratiques", items: files },
  ] as const;
  const visible = typed.filter((entry) => entry.items.length > 0);
  const toneFor = (key: string) => (visible.findIndex((entry) => entry.key === key) % 2 === 0 ? "white" : "ivory");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <Hero />

      <ResourceFamilies summaries={summaries} />

      <HomeSection>
        <SectionHeading
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

      {audios.length > 0 ? (
        <HomeSection tone={toneFor("audios")}>
          <SectionHeading
            eyebrow="À écouter"
            title={SECTIONS.audios.label}
            description={SECTIONS.audios.description}
            action={{ href: "/audios", label: SECTIONS.audios.allLabel }}
          />
          <div className="mt-12">
            <AudioHighlights audios={audios} />
          </div>
        </HomeSection>
      ) : null}

      {videos.length > 0 ? (
        <HomeSection tone={toneFor("videos")}>
          <SectionHeading
            eyebrow="À regarder"
            title={SECTIONS.videos.label}
            description={SECTIONS.videos.description}
            action={{ href: "/videos", label: SECTIONS.videos.allLabel }}
          />
          <div className="mt-12">
            <ResourceGrid resources={videos} section="videos" />
          </div>
        </HomeSection>
      ) : null}

      {books.length > 0 ? (
        <HomeSection tone={toneFor("livres")}>
          <SectionHeading
            eyebrow="À lire"
            title={SECTIONS.livres.label}
            description={SECTIONS.livres.description}
            action={{ href: "/livres", label: SECTIONS.livres.allLabel }}
          />
          <div className="mt-12">
            <ResourceGrid resources={books} section="livres" columns={4} />
          </div>
        </HomeSection>
      ) : null}

      {files.length > 0 ? (
        <HomeSection tone={toneFor("fichiers-pratiques")}>
          <SectionHeading
            eyebrow="À télécharger"
            title={SECTIONS["fichiers-pratiques"].label}
            description={SECTIONS["fichiers-pratiques"].description}
            action={{ href: "/fichiers-pratiques", label: SECTIONS["fichiers-pratiques"].allLabel }}
          />
          <div className="mt-12">
            <ResourceGrid resources={files} section="fichiers-pratiques" />
          </div>
        </HomeSection>
      ) : null}
    </>
  );
}
