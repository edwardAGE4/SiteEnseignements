import Link from "next/link";
import type { ResourceCardData } from "@/lib/resources";
import { resourcePath, TYPE_LABELS, type Section } from "@/lib/sections";
import { formatDurationHuman, formatFileSize } from "@/lib/media";
import { formatLabel } from "@/lib/file-validation";
import { cn, formatDate, resourceSummary } from "@/lib/utils";
import { ResourceVisual } from "@/components/public/ResourceVisual";
import { ArrowRightIcon, PlayIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/EmptyState";

type Variant = "media" | "book" | "file";

function variantFor(resource: ResourceCardData, section?: Section, mixed = false): Variant {
  // listes mixtes (accueil, recherche) : un seul format de carte pour des grilles regulieres
  if (mixed && !section) return "media";
  if (section === "livres" || (!section && resource.type === "BOOK")) return "book";
  if (section === "fichiers-pratiques" || (!section && resource.type === "FILE")) return "file";
  return "media";
}

/** Libelle de l'action selon la rubrique ("Écouter", "Regarder"...). */
function actionLabel(resource: ResourceCardData, section?: Section): string {
  if (section === "audios") return "Écouter";
  if (section === "videos") return "Regarder";
  if (section === "fichiers-pratiques") return resource.downloadPolicy === "DOWNLOAD" ? "Télécharger" : "Consulter";
  return "Découvrir";
}

/**
 * Carte d'une ressource. Le titre est le lien principal ; il couvre toute la
 * carte (pseudo-element) pour un clic confortable, sans liens imbriques.
 */
export function ResourceCard({
  resource,
  section,
  showType = false,
  headingLevel = "h3",
  priority = false,
}: {
  resource: ResourceCardData;
  /** rubrique dans laquelle la carte est affichee (lien et mise en forme) */
  section?: Section;
  /** affiche le type (Audio, Vidéo...) : utile dans les listes mixtes */
  showType?: boolean;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
}) {
  const variant = variantFor(resource, section, showType);
  const href = section ? `/${section}/${resource.slug}` : resourcePath(resource);
  const category = resource.categories[0]?.category.name;
  const Heading = headingLevel;
  const firstDocument = resource.documents[0];

  const meta = [
    resource.publishedAt ? formatDate(resource.publishedAt) : null,
    variant === "media" ? formatDurationHuman(resource.durationSeconds) || null : null,
    variant === "book" ? resource.author : null,
    variant === "file" && firstDocument ? formatLabel(firstDocument.fileName) || null : null,
    variant === "file" && firstDocument?.sizeBytes ? formatFileSize(firstDocument.sizeBytes) : null,
    variant === "file" && resource.documents.length > 1 ? `${resource.documents.length} fichiers` : null,
  ].filter(Boolean);

  const label = [showType ? TYPE_LABELS[resource.type] : null, category].filter(Boolean).join(" · ");

  const body = (
    <div className="flex min-w-0 flex-1 flex-col">
      {label ? (
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-600">{label}</p>
      ) : null}
      <Heading className="mt-2 font-display text-[1.3rem] font-medium leading-snug text-navy-900 text-balance">
        <Link
          href={href}
          className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none"
        >
          {resource.title}
        </Link>
      </Heading>
      {variant === "book" && resource.subtitle ? (
        <p className="mt-1 text-sm italic text-ink-500">{resource.subtitle}</p>
      ) : null}
      <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-ink-500">{resourceSummary(resource, 180)}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-5">
        {meta.length > 0 ? <p className="text-xs text-ink-500">{meta.join(" · ")}</p> : <span />}
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900">
          {actionLabel(resource, section)}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );

  const shell =
    "group relative flex h-full rounded-3xl bg-white ring-1 ring-navy-900/[0.07] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(20,38,61,0.55)] focus-within:ring-2 focus-within:ring-gold-500";

  if (variant === "file") {
    return (
      <article className={cn(shell, "items-start gap-5 p-6")}>
        <ResourceVisual resource={resource} className="aspect-square w-14 shrink-0 rounded-2xl" />

        {body}
      </article>
    );
  }

  if (variant === "book") {
    return (
      <article className={cn(shell, "flex-col p-4 sm:p-5")}>
        <div className="rounded-2xl bg-ivory-200 px-8 py-6">
          <ResourceVisual
            resource={resource}
            priority={priority}
            className="mx-auto aspect-[2/3] w-full max-w-[13rem] rounded-md shadow-[0_18px_30px_-18px_rgba(20,38,61,0.6)] transition-transform duration-500 group-hover:-translate-y-1"
          />
        </div>
        <div className="flex flex-1 flex-col px-2 pt-5 pb-1">{body}</div>
      </article>
    );
  }

  return (
    <article className={cn(shell, "flex-col p-3")}>
      <div className="relative">
        <ResourceVisual
          resource={resource}
          priority={priority}
          className={cn("aspect-video w-full rounded-[1.1rem]", resource.type === "BOOK" && "bg-ivory-200")}
          imageClassName={cn(
            "transition-transform duration-700 group-hover:scale-[1.03]",
            // couverture de livre entiere (format portrait) dans un cadre 16:9
            resource.type === "BOOK" && "object-contain p-3 drop-shadow-md",
          )}
        />
        {section === "videos" || (section !== "audios" && resource.type === "VIDEO") ? (
          <span
            aria-hidden
            className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow-md transition-transform group-hover:scale-105"
          >
            <PlayIcon className="ml-0.5 h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">{body}</div>
    </article>
  );
}

export function ResourceGrid({
  resources,
  section,
  showType,
  emptyTitle = "Aucune ressource trouvée",
  emptyDescription,
  emptyAction,
  columns = 3,
}: {
  resources: ResourceCardData[];
  section?: Section;
  showType?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  columns?: 2 | 3 | 4;
}) {
  if (resources.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const variant = variantFor(resources[0], section, showType);
  const grid =
    variant === "file"
      ? "grid-cols-1 md:grid-cols-2"
      : columns === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : columns === 2
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul className={cn("grid gap-6", grid)}>
      {resources.map((resource, index) => (
        <li key={resource.id} className="reveal">
          <ResourceCard resource={resource} section={section} showType={showType} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}
