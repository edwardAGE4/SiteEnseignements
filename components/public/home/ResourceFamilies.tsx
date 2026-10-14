import Link from "next/link";
import { HALO, HomeSection, sideFor } from "@/components/public/home/HomeSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, TypeIcon } from "@/components/ui/Icons";
import { SafeImage } from "@/components/ui/SafeImage";
import type { getSectionSummaries } from "@/lib/resources";
import { cn } from "@/lib/utils";

type Summary = Awaited<ReturnType<typeof getSectionSummaries>>[number];

const ACTIONS: Record<Summary["section"], string> = {
  audios: "Découvrir les audios",
  videos: "Découvrir les vidéos",
  livres: "Découvrir les livres",
  "fichiers-pratiques": "Découvrir les fichiers",
};

/** Les quatre familles de ressources (cible du bouton "Explorer les ressources"). */
export function ResourceFamilies({ summaries }: { summaries: Summary[] }) {
  return (
    <HomeSection id="ressources" labelledBy="ressources-titre" tone="white" halo={HALO.ressources} side={sideFor(0)}>
        <SectionHeading
          align={sideFor(0)}
          centerText
          eyebrow="Les ressources"
          title={<span id="ressources-titre">Quatre formats pour apprendre et avancer</span>}
          description="Écoutez, regardez, lisez ou téléchargez : toutes les ressources sont accessibles gratuitement."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaries.map((summary) => (
            <li key={summary.section} className="reveal">
              <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-ivory-100 ring-1 ring-navy-900/[0.06] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(20,38,61,0.55)] focus-within:ring-2 focus-within:ring-gold-500">
                <div
                  className={cn(
                    "relative flex aspect-[4/3] items-center justify-center overflow-hidden",
                    summary.section === "livres" ? "bg-ivory-200" : "bg-navy-900",
                  )}
                >
                  <TypeIcon
                    type={summary.type}
                    className={cn("h-12 w-12", summary.section === "livres" ? "text-navy-700" : "text-gold-300")}
                  />
                  {summary.coverImageUrl ? (
                    <SafeImage
                      src={summary.coverImageUrl}
                      alt=""
                      className={cn(
                        "transition-transform duration-700 group-hover:scale-[1.04]",
                        summary.section === "livres" && "object-contain p-6",
                      )}
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-medium text-navy-900">
                    <Link
                      href={summary.path}
                      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      {summary.label}
                    </Link>
                  </h3>
                  {summary.count > 0 ? (
                    <p className="mt-1 text-xs text-ink-500">
                      {summary.count} {summary.count > 1 ? "ressources disponibles" : "ressource disponible"}
                    </p>
                  ) : null}
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-500">{summary.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 max-md:self-center text-sm font-semibold text-navy-900">
                    {ACTIONS[summary.section]}
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
    </HomeSection>
  );
}
