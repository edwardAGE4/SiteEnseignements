import { cn } from "@/lib/utils";
import { getPortraitUrl } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";

/**
 * Photographie authentique de Jean-Marc GNALI (Admin > Parametres).
 * Sans photo enregistree : composition sobre aux initiales, sans faux portrait.
 */
export async function Portrait({
  className,
  priority = false,
  imageClassName,
}: {
  className?: string;
  priority?: boolean;
  imageClassName?: string;
}) {
  const url = await getPortraitUrl().catch(() => null);

  if (!url) {
    return (
      <div
        aria-hidden
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-navy-900",
          "bg-[radial-gradient(circle_at_30%_20%,rgba(185,154,98,0.22),transparent_55%)]",
          className,
        )}
      >
        <span className="font-display text-[clamp(3rem,8vw,6rem)] font-light tracking-[0.08em] text-gold-300/80">JMG</span>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden bg-navy-900", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={SITE_NAME}
        className={cn("h-full w-full object-cover object-[center_25%]", imageClassName)}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
