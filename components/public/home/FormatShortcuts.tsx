import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ChevronRightIcon, TypeIcon } from "@/components/ui/Icons";
import type { SectionConfig } from "@/lib/sections";

/**
 * Raccourcis vers les rubriques (Audios, Videos...) avec leur nombre de
 * ressources, juste sous le hero : l'entree par format, a cote de l'entree
 * par theme (rangees de categories).
 */
export function FormatShortcuts({ summaries }: { summaries: (SectionConfig & { count: number })[] }) {
  return (
    <section aria-label="Parcourir par format" className="border-y border-navy-900/[0.08] bg-white">
      <Container className="py-5 md:py-7">
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {summaries.map((section) => (
            <li key={section.section}>
              <Link
                href={section.path}
                className="group flex h-full items-center gap-3 rounded-2xl border border-navy-900/[0.07] bg-background p-3 transition-colors hover:border-navy-900/25 md:gap-3.5 md:rounded-[1.25rem] md:px-4.5 md:py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300 md:h-12 md:w-12 md:rounded-[0.9rem]">
                  <TypeIcon type={section.type} className="h-5 w-5 md:h-6 md:w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[0.95rem] font-bold leading-tight text-navy-900 md:text-[1.05rem]">
                    {section.label}
                  </span>
                  <span className="text-xs text-ink-500 md:text-[0.8rem]">
                    {section.count === 0
                      ? "Bientôt disponible"
                      : `${section.count} ${section.count > 1 ? "ressources" : "ressource"}`}
                  </span>
                </span>
                <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5 md:block" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
