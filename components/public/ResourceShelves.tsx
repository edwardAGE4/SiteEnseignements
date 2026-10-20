import Link from "next/link";
import type { ResourceCardData } from "@/lib/resources";
import { SECTIONS, type Section } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { ResourceVisual } from "@/components/public/ResourceVisual";
import { ChevronRightIcon, PlayIcon } from "@/components/ui/Icons";

export type Shelf = {
  /** null : rangee des ressources sans categorie */
  slug: string | null;
  name: string;
  description: string | null;
  items: ResourceCardData[];
  total: number;
};

/** Format des vignettes selon la rubrique : carre (audio), paysage (video), couverture (livre). */
const TILE: Record<Section, { width: string; aspect: string }> = {
  audios: { width: "w-40 sm:w-48", aspect: "aspect-square" },
  videos: { width: "w-64 sm:w-72", aspect: "aspect-video" },
  livres: { width: "w-32 sm:w-40", aspect: "aspect-[2/3]" },
  "fichiers-pratiques": { width: "w-40 sm:w-48", aspect: "aspect-square" },
};

function countLabel(total: number) {
  return `${total} ${total > 1 ? "ressources" : "ressource"}`;
}

/** Vignette d'une rangee : visuel + titre, toute la vignette est cliquable. */
function ShelfTile({ resource, section }: { resource: ResourceCardData; section: Section }) {
  const tile = TILE[section];
  return (
    <li className={cn("shrink-0 snap-start", tile.width)}>
      <Link href={`/${section}/${resource.slug}`} className="group block rounded-2xl">
        <div className="relative">
          <ResourceVisual
            resource={resource}
            className={cn(
              tile.aspect,
              "w-full rounded-2xl shadow-[0_14px_30px_-22px_rgba(20,38,61,0.7)] ring-1 ring-navy-900/[0.06]",
            )}
            imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {section === "videos" ? (
            <span
              aria-hidden
              className="absolute bottom-2.5 left-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow-md"
            >
              <PlayIcon className="ml-0.5 h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-2 font-display text-[0.95rem] font-medium leading-snug text-navy-900 group-hover:underline group-hover:underline-offset-4">
          {resource.title}
        </p>
      </Link>
    </li>
  );
}

/**
 * Bibliotheque rangee par categories : pour chacune, le titre, le nombre de
 * ressources, « Tout voir » (liste filtree) et une rangee qui defile a l'horizontale.
 */
export function ResourceShelves({ shelves, section }: { shelves: Shelf[]; section: Section }) {
  const basePath = SECTIONS[section].path;

  return (
    <div className="space-y-12 md:space-y-14">
      {shelves.map((shelf) => {
        const headingId = `rangee-${shelf.slug ?? "autres"}`;
        // pas de filtre « sans categorie » : « Tout voir » ouvre alors la liste complete
        const seeAll = shelf.slug ? `${basePath}?categorie=${encodeURIComponent(shelf.slug)}` : `${basePath}?tri=recent`;

        return (
          <section key={headingId} aria-labelledby={headingId}>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 id={headingId} className="font-display text-2xl font-medium text-navy-900 md:text-[1.7rem]">
                  {shelf.name}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{shelf.description || countLabel(shelf.total)}</p>
              </div>
              <Link
                href={seeAll}
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
