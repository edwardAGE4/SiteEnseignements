import Link from "next/link";
import type { ResourceCardData } from "@/lib/resources";
import { resourcePath, TYPE_LABELS, type Section } from "@/lib/sections";
import { formatDurationHuman } from "@/lib/media";
import { cn } from "@/lib/utils";
import { ResourceVisual } from "@/components/public/ResourceVisual";
import { ChevronRightIcon, PlayIcon, TypeIcon } from "@/components/ui/Icons";

export type Shelf = {
  /** identifiant unique dans la page (ancre du titre) */
  id: string;
  /** categorie de la rangee ; null : nouveautes, ressources sans categorie... */
  slug: string | null;
  name: string;
  description: string | null;
  items: ResourceCardData[];
  total: number;
  /** destination de « Tout voir » (sinon calculee par seeAllHref) */
  href?: string;
};

/** Format des vignettes selon la rubrique : carre (audio), paysage (video), couverture (livre). */
const TILE: Record<Section, { width: string; aspect: string }> = {
  audios: { width: "w-40 sm:w-48", aspect: "aspect-square" },
  videos: { width: "w-64 sm:w-72", aspect: "aspect-video" },
  livres: { width: "w-32 sm:w-40", aspect: "aspect-[2/3]" },
  "fichiers-pratiques": { width: "w-40 sm:w-48", aspect: "aspect-square" },
};
/** Rangees melangeant les types (accueil, recherche) : vignettes carrees homogenes. */
const MIXED_TILE = { width: "w-[9.5rem] sm:w-48", aspect: "aspect-square" };

const NEW_FOR_MS = 14 * 24 * 60 * 60 * 1000;

function countLabel(total: number) {
  return `${total} ${total > 1 ? "ressources" : "ressource"}`;
}

/** Publiee depuis moins de 14 jours : badge « NOUVEAU ». */
function isNew(resource: ResourceCardData) {
  return Boolean(resource.publishedAt && Date.now() - resource.publishedAt.getTime() < NEW_FOR_MS);
}

/** Vignette d'une rangee : visuel + titre, toute la vignette est cliquable. */
function ShelfTile({ resource, section }: { resource: ResourceCardData; section?: Section }) {
  const tile = section ? TILE[section] : MIXED_TILE;
  const href = section ? `/${section}/${resource.slug}` : resourcePath(resource);
  const meta = section
    ? null
    : [TYPE_LABELS[resource.type], formatDurationHuman(resource.durationSeconds) || (resource.type === "BOOK" ? resource.author : null)]
        .filter(Boolean)
        .join(" · ");

  return (
    <li className={cn("shrink-0 snap-start", tile.width)}>
      <Link href={href} className="group block rounded-2xl">
        <div className="relative">
          <ResourceVisual
            resource={resource}
            className={cn(
              tile.aspect,
              "w-full rounded-2xl shadow-[0_14px_30px_-22px_rgba(20,38,61,0.7)] ring-1 ring-navy-900/[0.06]",
            )}
            imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {isNew(resource) ? (
            <span className="absolute top-2.5 right-2.5 rounded-md bg-red-600 px-2 py-0.5 text-[0.65rem] font-bold tracking-[0.08em] text-white">
              NOUVEAU
            </span>
          ) : null}
          {section === "videos" ? (
            <span
              aria-hidden
              className="absolute bottom-2.5 left-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow-md"
            >
              <PlayIcon className="ml-0.5 h-3.5 w-3.5" />
            </span>
          ) : null}
          {!section ? (
            // format de la ressource, pour savoir avant de cliquer si on va ecouter, regarder ou lire
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 py-1 pr-2.5 pl-2 text-[0.7rem] font-semibold text-navy-900 shadow-md">
              <TypeIcon type={resource.type} className="h-3.5 w-3.5" />
              {TYPE_LABELS[resource.type]}
            </span>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-2 font-display text-[0.95rem] font-medium leading-snug text-navy-900 group-hover:underline group-hover:underline-offset-4">
          {resource.title}
        </p>
        {meta ? <p className="mt-0.5 text-xs text-ink-500">{meta}</p> : null}
      </Link>
    </li>
  );
}

/**
 * Ressources rangees par categories : pour chacune, le titre, la description
 * (ou le nombre de ressources), « Tout voir » et une rangee qui defile a
 * l'horizontale. Avec `section` : vignettes au format de la rubrique ; sans :
 * types melanges, vignettes carrees avec le format indique.
 */
export function ResourceShelves({
  shelves,
  section,
  seeAllHref,
  headingLevel: Heading = "h2",
}: {
  shelves: Shelf[];
  section?: Section;
  /** h3 quand les rangees sont sous un titre de section (accueil) */
  headingLevel?: "h2" | "h3";
  /** destination de « Tout voir » pour une categorie (slug) ou les ressources sans categorie (null) */
  seeAllHref: (slug: string | null) => string;
}) {
  return (
    <div className="space-y-12 md:space-y-14">
      {shelves.map((shelf) => {
        const headingId = `rangee-${shelf.id}`;
        return (
          <section key={shelf.id} aria-labelledby={headingId}>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <Heading id={headingId} className="font-display text-2xl font-medium text-navy-900 md:text-[1.7rem]">
                  {shelf.name}
                </Heading>
                <p className="mt-1 text-sm text-ink-500">{shelf.description || countLabel(shelf.total)}</p>
              </div>
              <Link
                href={shelf.href ?? seeAllHref(shelf.slug)}
                className="inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-medium text-ink-500 hover:text-navy-900"
              >
                Tout voir
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only"> : {shelf.name}</span>
              </Link>
            </div>

            {/* deborde jusqu'aux bords de l'ecran sur mobile, comme une application */}
            <ul className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:-mx-10 lg:scroll-px-10 lg:px-10">
              {shelf.items.map((resource) => (
                <ShelfTile key={resource.id} resource={resource} section={section} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
