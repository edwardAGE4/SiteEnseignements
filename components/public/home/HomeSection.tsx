import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

/** Teintes du halo decoratif de chaque section de l'accueil. */
export const HALO = {
  ressources: "rgba(185,154,98,0.3)",
  nouveautes: "#0052d124",
  audios: "rgba(16,185,129,0.14)",
  videos: "rgba(124,58,237,0.12)",
  livres: "rgba(220,38,38,0.11)",
  "fichiers-pratiques": "rgba(185,154,98,0.22)",
} as const;

/** Cote du titre pour la section n : droite, gauche, droite... (le halo est du cote oppose). */
export const sideFor = (index: number) => (index % 2 === 0 ? "right" : "left");

/**
 * Section de l'accueil avec un halo colore oppose au titre.
 * Sur mobile, les textes sont centres ; les titres gardent leur alignement (SectionHeading).
 */
export function HomeSection({
  children,
  tone = "ivory",
  halo,
  haloOpacity = 0.5,
  side,
  id,
  labelledBy,
}: {
  children: React.ReactNode;
  tone?: "ivory" | "white";
  halo: string;
  haloOpacity?: number;
  side: "left" | "right";
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative overflow-hidden py-20 md:py-28", tone === "white" ? "bg-white" : "bg-ivory-100")}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-40 h-[36rem] w-[36rem] rounded-full",
          side === "left" ? "-right-40" : "-left-40",
        )}
        // opacite reduite (le halo du Hero, a part, garde la sienne)
        style={{ backgroundImage: `radial-gradient(circle, ${halo}, transparent 65%)`, opacity: haloOpacity }}
      />
      <Container className="relative max-md:text-center">{children}</Container>
    </section>
  );
}
