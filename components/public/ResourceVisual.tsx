import type { ResourceType } from "@/generated/prisma/enums";
import { parseVideoUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { TypeIcon } from "@/components/ui/Icons";
import { SafeImage } from "@/components/ui/SafeImage";

type VisualResource = {
  type: ResourceType;
  coverImageUrl: string | null;
  videoUrl: string | null;
};

/** Image a afficher pour une ressource : couverture, sinon miniature de la video. */
export function resourceImageUrl(resource: VisualResource): string | null {
  return resource.coverImageUrl || parseVideoUrl(resource.videoUrl)?.thumbnailUrl || null;
}

const FALLBACK_TONES: Record<ResourceType, string> = {
  AUDIO: "bg-navy-900 text-gold-300",
  VIDEO: "bg-navy-800 text-gold-300",
  BOOK: "bg-ivory-200 text-navy-700",
  FILE: "bg-navy-100 text-navy-700",
};

/**
 * Visuel d'une ressource. `alt` vide par defaut : sur une carte, le titre est
 * deja lu juste a cote (image decorative). Si l'image est absente ou
 * introuvable, un visuel sobre avec l'icone du type est affiche.
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
    <div className={cn("relative overflow-hidden", FALLBACK_TONES[resource.type], className)}>
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(185,154,98,0.18),transparent_60%)]">
        <TypeIcon type={resource.type} className="h-10 w-10 opacity-80" />
      </div>
      {src ? <SafeImage src={src} alt={alt} priority={priority} className={imageClassName} /> : null}
    </div>
  );
}
