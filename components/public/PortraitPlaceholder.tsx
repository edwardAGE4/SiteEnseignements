import { cn } from "@/lib/utils";

/**
 * Emplacement reserve a une photographie authentique du Pasteur Jean-Marc GNALI.
 * A remplacer par le composant `next/image` une fois les photographies officielles fournies.
 */
export function PortraitPlaceholder({
  className,
  label = "Photographie du Pasteur Jean-Marc GNALI",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(212,181,116,0.25),transparent_55%),linear-gradient(160deg,#0b1f33_0%,#102a43_55%,#0a1826_100%)]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(115deg,#fff_0px,#fff_1px,transparent_1px,transparent_10px)]" />
      <span className="relative px-8 text-center font-accent text-xs uppercase tracking-[0.25em] text-ivory-100/50">
        {label}
      </span>
    </div>
  );
}
