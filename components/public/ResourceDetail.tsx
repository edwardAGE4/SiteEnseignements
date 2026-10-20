import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RichText } from "@/components/ui/RichText";
import { buttonClassName } from "@/components/ui/Button";
import { ExternalIcon, YoutubeIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { AudioPlayer } from "@/components/public/AudioPlayer";
import { VideoPlayer } from "@/components/public/VideoPlayer";
import { SpotifyEmbed } from "@/components/public/SpotifyEmbed";
import { DocumentList } from "@/components/public/DocumentList";
import { LikeButton, LikesProvider } from "@/components/public/Likes";
import { ViewTracker } from "@/components/public/ViewTracker";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { ResourceVisual, resourceImageUrl } from "@/components/public/ResourceVisual";
import type { ResourceCardData, ResourceDetailData } from "@/lib/resources";
import { resourcePath, SECTIONS, TYPE_LABELS, type Section } from "@/lib/sections";
import { formatDurationHuman, parseVideoUrl, toIsoDuration, VIDEO_PROVIDER_LABELS } from "@/lib/media";
import { getSiteUrl } from "@/lib/site-url";
import { formatDate, resourceSummary } from "@/lib/utils";

/** Metadonnees SEO d'une fiche (URL canonique = rubrique principale de la ressource). */
export function resourceMetadata(resource: ResourceDetailData): Metadata {
  const title = resource.seoTitle || resource.title;
  const description = resource.seoDescription || resourceSummary(resource, 160);
  const image = resourceImageUrl(resource);
  const canonical = resourcePath(resource);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: resource.type === "BOOK" ? "book" : resource.type === "VIDEO" ? "video.other" : "article",
      images: image ? [{ url: image, alt: resource.title }] : undefined,
      ...(resource.publishedAt && resource.type !== "BOOK" && resource.type !== "VIDEO"
        ? { publishedTime: resource.publishedAt.toISOString() }
        : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

function structuredData(resource: ResourceDetailData, section: Section) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${resourcePath(resource)}`;
  const image = resourceImageUrl(resource);
  const absolute = (value: string | null) => (value ? new URL(value, siteUrl).toString() : undefined);
  const common = {
    "@context": "https://schema.org",
    name: resource.title,
    description: resourceSummary(resource, 300),
    url,
    inLanguage: "fr",
    ...(image ? { image: absolute(image) } : {}),
    ...(resource.publishedAt ? { datePublished: resource.publishedAt.toISOString() } : {}),
  };

  let main: Record<string, unknown>;
  const video = parseVideoUrl(resource.videoUrl);
  if (section === "videos" && video) {
    main = {
      ...common,
      "@type": "VideoObject",
      embedUrl: video.embedUrl,
      ...(image ? { thumbnailUrl: absolute(image) } : {}),
      ...(resource.publishedAt ? { uploadDate: resource.publishedAt.toISOString() } : {}),
      ...(resource.durationSeconds ? { duration: toIsoDuration(resource.durationSeconds) } : {}),
    };
  } else if (section === "audios") {
    main = {
      ...common,
      "@type": "AudioObject",
      ...(resource.audioUrl ? { contentUrl: absolute(resource.audioUrl) } : {}),
      ...(resource.durationSeconds ? { duration: toIsoDuration(resource.durationSeconds) } : {}),
    };
  } else if (section === "livres") {
    main = {
      ...common,
      "@type": "Book",
      ...(resource.author ? { author: { "@type": "Person", name: resource.author } } : {}),
      ...(resource.isbn ? { isbn: resource.isbn } : {}),
    };
  } else {
    main = { ...common, "@type": "DigitalDocument" };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: SECTIONS[section].label, item: `${siteUrl}${SECTIONS[section].path}` },
      { "@type": "ListItem", position: 3, name: resource.title, item: url },
    ],
  };

  return [main, breadcrumb];
}

function JsonLd({ data }: { data: unknown }) {
  // "<" echappe : le contenu saisi ne peut pas fermer la balise script
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}

function MetaList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  const visible = items.filter((item) => item.value);
  if (visible.length === 0) return null;
  return (
    <dl className="divide-y divide-navy-900/10 rounded-3xl bg-white px-6 ring-1 ring-navy-900/[0.07]">
      {visible.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-6 py-4">
          <dt className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{item.label}</dt>
          <dd className="min-w-0 text-right text-sm font-medium break-words text-ink-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Liens vers les autres formats d'une meme ressource (ex. version video d'un audio). */
function OtherFormats({ resource, section }: { resource: ResourceDetailData; section: Section }) {
  const links = [
    section !== "videos" && resource.videoUrl ? { href: `/videos/${resource.slug}`, label: "Voir la version vidéo" } : null,
    section !== "audios" && (resource.audioUrl || resource.spotifyUrl)
      ? { href: `/audios/${resource.slug}`, label: "Écouter la version audio" }
      : null,
  ].filter((link): link is { href: string; label: string } => link !== null);

  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={buttonClassName({ variant: "outline", size: "sm" })}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function ResourceDetail({
  resource,
  section,
  related,
  preview = false,
}: {
  resource: ResourceDetailData;
  section: Section;
  related: ResourceCardData[];
  /** apercu dans l'administration : pas de compteur de vues ni de "j'aime" */
  preview?: boolean;
}) {
  const config = SECTIONS[section];
  const video = parseVideoUrl(resource.videoUrl);
  const allowDownload = resource.downloadPolicy === "DOWNLOAD";
  const categories = resource.categories.map((link) => link.category);
  const summary = resource.excerpt?.trim();

  const metaItems = [
    { label: "Format", value: TYPE_LABELS[config.type] },
    {
      label: categories.length > 1 ? "Catégories" : "Catégorie",
      value: categories.length
        ? categories.map((category, index) => (
            <span key={category.id}>
              {index > 0 ? ", " : ""}
              <Link href={`/categories/${category.slug}`} className="underline-offset-4 hover:underline">
                {category.name}
              </Link>
            </span>
          ))
        : null,
    },
    { label: "Série", value: section === "audios" || section === "videos" ? resource.series : null },
    { label: "Auteur", value: section === "livres" ? resource.author : null },
    { label: "Durée", value: section === "audios" || section === "videos" ? formatDurationHuman(resource.durationSeconds) : null },
    { label: "Source", value: section === "videos" && video ? VIDEO_PROVIDER_LABELS[video.provider] : null },
    { label: "Formats", value: section === "livres" && resource.bookFormats.length ? resource.bookFormats.join(", ") : null },
    { label: "ISBN", value: section === "livres" ? resource.isbn : null },
    { label: "Publication", value: resource.publishedAt ? formatDate(resource.publishedAt) : null },
  ];

  const header = (
    <div className="min-w-0 flex-1 space-y-5">
      <h1 className="font-display text-balance break-words text-[clamp(2.25rem,4.6vw,3.5rem)] font-bold leading-[1.1] text-navy-900">
        {resource.title}
      </h1>
      {resource.subtitle && section === "livres" ? (
        <p className="font-display text-xl italic text-ink-700">{resource.subtitle}</p>
      ) : null}
      {summary ? <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-700">{summary}</p> : null}
    </div>
  );

  const media = (
    <div className="space-y-4">
      {section === "videos" && resource.videoUrl ? (
        <div className="space-y-3">
          <VideoPlayer url={resource.videoUrl} title={resource.title} posterUrl={resource.coverImageUrl} />
          {preview ? null : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {video?.provider === "youtube" ? (
                <>
                  {/* liker et commenter se font sur YouTube (app sur mobile), avec le compte du visiteur */}
                  <a href={video.watchUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName({ variant: "outline", size: "sm" })}>
                    <YoutubeIcon className="h-4 w-4" />
                    J&apos;aime sur YouTube
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                  <a href={video.watchUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName({ variant: "outline", size: "sm" })}>
                    Commenter sur YouTube
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </>
              ) : null}
              <LikeButton target="youtube" label="la vidéo" />
            </div>
          )}
        </div>
      ) : null}

      {section === "audios" ? (
        <div className="space-y-5">
          {resource.audioUrl ? (
            <div className="space-y-3">
              <AudioPlayer src={resource.audioUrl} title={resource.title} knownDuration={resource.durationSeconds} />
              {preview ? null : (
                <div className="flex justify-end">
                  <LikeButton target="audio" label="l'audio" />
                </div>
              )}
            </div>
          ) : null}
          {resource.spotifyUrl ? (
            <div className="space-y-3">
              <SpotifyEmbed url={resource.spotifyUrl} title={resource.title} />
              {preview ? null : (
                <div className="flex justify-end">
                  <LikeButton target="spotify" label="l'audio Spotify" />
                </div>
              )}
            </div>
          ) : null}
          {!resource.audioUrl && !resource.spotifyUrl ? (
            <p role="alert" className="rounded-2xl border border-orange-300 bg-orange-50 px-5 py-4 text-sm text-orange-900">
              Cet audio n&apos;est pas disponible pour le moment.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const bookLinks =
    section === "livres" && (resource.readUrl || resource.purchaseUrl) ? (
      <div className="flex flex-wrap gap-3">
        {resource.readUrl ? (
          <a href={resource.readUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName({ variant: "primary" })}>
            Lire en ligne
            <ExternalIcon className="h-4 w-4" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        ) : null}
        {resource.purchaseUrl ? (
          <a href={resource.purchaseUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName({ variant: "outline" })}>
            Se procurer le livre
            <ExternalIcon className="h-4 w-4" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        ) : null}
      </div>
    ) : null;

  const documents = (
    <DocumentList
      slug={resource.slug}
      documents={resource.documents}
      allowDownload={allowDownload}
      withLikes={!preview}
      title={
        section === "fichiers-pratiques"
          ? resource.documents.length > 1
            ? "Fichiers à consulter"
            : "Fichier à consulter"
          : section === "livres"
            ? "Versions numériques"
            : "Documents d'accompagnement"
      }
    />
  );

  const description = (
    <div className="prose-editorial text-[1.05rem] leading-[1.8] text-ink-700">
      <RichText text={resource.description} />
      {resource.tags.length > 0 ? (
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Mots-clés">
          {resource.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/recherche?q=${encodeURIComponent(tag)}`}
                className="inline-block rounded-full bg-navy-900/5 px-3 py-1 text-xs text-ink-700 hover:bg-navy-900/10"
              >
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  const content = (
    <>
      {preview ? null : <ViewTracker slug={resource.slug} />}
      {preview ? null : structuredData(resource, section).map((data, index) => <JsonLd key={index} data={data} />)}

      <Container className="pt-8 pb-16 md:pt-10 md:pb-24">
        <Breadcrumbs
          items={[{ label: "Accueil", href: "/" }, { label: config.label, href: config.path }, { label: resource.title }]}
        />

        {section === "videos" ? (
          <div className="mt-8 space-y-10">
            {media}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="min-w-0 space-y-10">
                {header}
                <OtherFormats resource={resource} section={section} />
                {description}
                {documents}
              </div>
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <MetaList items={metaItems} />
              </aside>
            </div>
          </div>
        ) : section === "livres" ? (
          <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
            <div className="md:sticky md:top-28 md:self-start">
              <div className="rounded-3xl bg-ivory-200 p-8">
                <ResourceVisual
                  resource={resource}
                  alt={`Couverture du livre « ${resource.title} »`}
                  priority
                  className="mx-auto aspect-[2/3] w-full max-w-[16rem] rounded-md shadow-[0_24px_40px_-20px_rgba(20,38,61,0.6)]"
                />
              </div>
            </div>
            <div className="min-w-0 space-y-10">
              {header}
              {resource.author ? <p className="text-sm text-ink-500">Par <span className="font-semibold text-ink-900">{resource.author}</span></p> : null}
              {bookLinks}
              {description}
              {documents}
              <MetaList items={metaItems} />
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-10">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
                <ResourceVisual
                  resource={resource}
                  alt=""
                  priority
                  className={
                    section === "audios"
                      ? "aspect-square w-36 shrink-0 rounded-3xl sm:w-44"
                      : "aspect-square w-20 shrink-0 rounded-3xl"
                  }
                />
                {header}
              </div>
              {media}
              {section === "fichiers-pratiques" ? documents : null}
              <OtherFormats resource={resource} section={section} />
              {description}
              {section !== "fichiers-pratiques" ? documents : null}
            </div>
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <MetaList items={metaItems} />
            </aside>
          </div>
        )}
      </Container>

      {related.length > 0 ? (
        <section className="border-t border-navy-900/10 bg-ivory-200/60 py-16 md:py-24">
          <Container>
            <SectionHeading
              eyebrow="À découvrir aussi"
              title="Ressources associées"
              action={{ href: config.path, label: config.allLabel }}
            />
            <div className="mt-10">
              <ResourceGrid resources={related} section={section} />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );

  return preview ? content : <LikesProvider slug={resource.slug}>{content}</LikesProvider>;
}

