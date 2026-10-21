import type { ResourceType } from "@/generated/prisma/enums";
import { parseVideoUrl } from "@/lib/media";
import { TYPE_LABELS } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { TypeIcon } from "@/components/ui/Icons";
import { SafeImage } from "@/components/ui/SafeImage";

type VisualResource = {
  type: ResourceType;
  coverImageUrl: string | null;
  videoUrl: string | null;
  slug: string;
  title: string;
  categories: { category: { name: string } }[];
};

/** Image a afficher pour une ressource : couverture, sinon miniature de la video. */
export function resourceImageUrl(resource: Pick<VisualResource, "coverImageUrl" | "videoUrl">): string | null {
  return resource.coverImageUrl || parseVideoUrl(resource.videoUrl)?.thumbnailUrl || null;
}

/** Fonds des visuels generes : une teinte qui se fond dans le noir. */
const GRADIENTS = [
  "radial-gradient(circle at 30% 20%, #3a5d80, #0e1b2c 70%)", // bleu nuit
  "radial-gradient(circle at 70% 20%, #8a5a2b, #2a1708 75%)", // brun
  "radial-gradient(circle at 30% 80%, #2f6b4f, #0c2118 75%)", // vert
  "radial-gradient(circle at 60% 30%, #7a2e3b, #24090f 75%)", // bordeaux
  "radial-gradient(circle at 50% 10%, #b99a62, #3b2a10 80%)", // dore
  "radial-gradient(circle at 20% 30%, #4a4f9c, #11132e 75%)", // indigo
];

/** Teinte stable d'une ressource (toujours la meme pour un meme slug, variee d'une ressource a l'autre). */
function gradientFor(slug: string) {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

/**
 * Visuel d'une ressource. `alt` vide par defaut : sur une carte, le titre est
 * deja lu juste a cote (image decorative). Sans image (ou image introuvable),
 * un visuel est genere : degrade de couleur, categorie et titre au centre ;
 * sur les petites vignettes, seulement l'icone du type (texte illisible).
 */
export function ResourceVisual({
  resource,
  className,
  alt = "",
  priority = false,
  imageClassName,
}: {
  resource: VisualResource;
  className?: string;
  alt?: string;
  priority?: boolean;
  imageClassName?: string;
}) {
  const src = resourceImageUrl(resource);
  const label = resource.categories[0]?.category.name ?? TYPE_LABELS[resource.type];

  return (
    <div className={cn("@container relative overflow-hidden", className)} style={{ background: gradientFor(resource.slug) }}>
      <div
        {...(!src && alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
        className="absolute inset-0 flex items-center justify-center p-[9cqw] text-center"
      >
        <TypeIcon type={resource.type} className="h-[40cqw] w-[40cqw] text-gold-300/80 @[7rem]:hidden" />
        <div className="hidden min-w-0 @[7rem]:block">
          <p className="font-cover text-[clamp(7px,4.2cqw,12px)] font-medium uppercase tracking-[0.22em] text-gold-300/85">
            {label}
          </p>
          {/* 2 lignes maximum, puis « … » */}
          <p className="mt-[4cqw] line-clamp-2 font-cover text-[clamp(10px,8cqw,26px)] font-semibold uppercase leading-[1.2] break-words text-white">
            {resource.title}
          </p>
        </div>
      </div>
      {src ? <SafeImage src={src} alt={alt} priority={priority} className={imageClassName} /> : null}
    </div>
  );
}
