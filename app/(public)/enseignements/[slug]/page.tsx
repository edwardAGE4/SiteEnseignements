import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";
import { VideoEmbed } from "@/components/public/VideoEmbed";
import { SpotifyEmbed } from "@/components/public/SpotifyEmbed";
import { PdfButton } from "@/components/public/PdfButton";
import { ViewTracker } from "@/components/public/ViewTracker";
import { TeachingGrid } from "@/components/public/TeachingGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getTeachingBySlug, getRelatedTeachings } from "@/lib/teachings";
import { formatDate } from "@/lib/utils";

export const revalidate = 30;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const teaching = await getTeachingBySlug(slug);
  if (!teaching) return {};

  return {
    title: teaching.title,
    description: teaching.description,
    alternates: { canonical: `/enseignements/${teaching.slug}` },
    openGraph: {
      title: teaching.title,
      description: teaching.description,
      type: "article",
      images: teaching.coverImageUrl ? [teaching.coverImageUrl] : undefined,
    },
  };
}

export default async function TeachingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const teaching = await getTeachingBySlug(slug);

  if (!teaching) notFound();

  const categoryIds = teaching.categories.map((c) => c.categoryId);
  const related = await getRelatedTeachings(teaching.id, categoryIds, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": teaching.youtubeUrl ? "VideoObject" : teaching.spotifyUrl ? "PodcastEpisode" : "Article",
    name: teaching.title,
    description: teaching.description,
    datePublished: teaching.publishedAt?.toISOString(),
    url: `${siteUrl}/enseignements/${teaching.slug}`,
    ...(teaching.coverImageUrl ? { thumbnailUrl: teaching.coverImageUrl, image: teaching.coverImageUrl } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Enseignements", item: `${siteUrl}/enseignements` },
      { "@type": "ListItem", position: 3, name: teaching.title, item: `${siteUrl}/enseignements/${teaching.slug}` },
    ],
  };

  return (
    <div className="pt-32">
      <ViewTracker slug={teaching.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Container className="max-w-3xl pb-16">
        <nav className="mb-8 flex flex-wrap items-center gap-2">
          {teaching.categories.map(({ category }) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Tag>{category.name}</Tag>
            </Link>
          ))}
        </nav>

        <h1 className="font-display text-balance text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] text-navy-900">
          {teaching.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 font-data text-sm text-ink-500">
          <span>{formatDate(teaching.publishedAt)}</span>
          <span>·</span>
          <span>{teaching.viewCount} vue{teaching.viewCount > 1 ? "s" : ""}</span>
        </div>

        <p className="prose-editorial mt-8 text-lg leading-relaxed text-ink-700">
          {teaching.description}
        </p>
      </Container>

      <Container className="max-w-3xl space-y-8 pb-24">
        {teaching.youtubeUrl ? <VideoEmbed url={teaching.youtubeUrl} /> : null}
        {teaching.spotifyUrl ? <SpotifyEmbed url={teaching.spotifyUrl} /> : null}
        {teaching.pdfUrl ? <PdfButton slug={teaching.slug} /> : null}

        {teaching.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-4">
            {teaching.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-ink-900/5 px-3 py-1 font-data text-xs text-ink-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </Container>

      {related.length > 0 ? (
        <section className="bg-ivory-200 py-24">
          <Container>
            <SectionHeading eyebrow="A decouvrir aussi" title="Vous pourriez egalement decouvrir" />
            <div className="mt-14">
              <TeachingGrid teachings={related} />
            </div>
          </Container>
        </section>
      ) : null}
    </div>
  );
}
