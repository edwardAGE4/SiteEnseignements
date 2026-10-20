import type { ResourceType } from "@/generated/prisma/enums";
import { parseVideoUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

type VisualResource = {
  type: ResourceType;
  coverImageUrl: string | null;
  videoUrl: string | null;
};

/** Logo JMG, affiche quand une ressource n'a pas d'image (ou que son image est introuvable). */
export const DEFAULT_RESOURCE_IMAGE = "/icons/icon-512.png";

/** Image a afficher pour une ressource : couverture, sinon miniature de la video. */
export function resourceImageUrl(resource: VisualResource): string | null {
  return resource.coverImageUrl || parseVideoUrl(resource.videoUrl)?.thumbnailUrl || null;
}

/**
 * Visuel d'une ressource. `alt` vide par defaut : sur une carte, le titre est
 * deja lu juste a cote (image decorative). Si l'image est absente ou
 * introuvable, le logo JMG est affiche sur fond noir (couleur du logo).
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

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo statique, sous l'image de la ressource */}
      <img
        src={DEFAULT_RESOURCE_IMAGE}
        alt={src ? "" : alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
      />
      {src ? <SafeImage src={src} alt={alt} priority={priority} className={imageClassName} /> : null}
    </div>
  );
}
