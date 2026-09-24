import { cn } from "@/lib/utils";
import { getPastorPortraitUrl } from "@/lib/settings";
import { PortraitPlaceholder } from "@/components/public/PortraitPlaceholder";

/**
 * Photographie du Pasteur Jean-Marc GNALI, modifiable depuis
 * Admin > Parametres. Affiche l'emplacement reserve tant qu'aucune photo
 * n'a ete choisie.
 */
export async function PastorPortrait({ className, priority = false }: { className?: string; priority?: boolean }) {
  const url = await getPastorPortraitUrl();

  if (!url) return <PortraitPlaceholder className={className} />;

  return (
    // pas de classe de positionnement ici : className peut deja contenir "absolute"
    <div className={cn("overflow-hidden bg-navy-950", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Pasteur Jean-Marc GNALI"
        className="h-full w-full object-cover object-[center_25%]"
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}
