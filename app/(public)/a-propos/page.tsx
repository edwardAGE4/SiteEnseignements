import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow, SectionHeading } from "@/components/ui/SectionHeading";
import { MultilineText, RichText } from "@/components/ui/RichText";
import { ArrowRightIcon, TypeIcon } from "@/components/ui/Icons";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Portrait } from "@/components/public/Portrait";
import { ResourceGrid } from "@/components/public/ResourceCard";
import { getLatestResources } from "@/lib/resources";
import { SECTION_LIST } from "@/lib/sections";
import { getBiography, getPortraitUrl } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { stripRichText, truncate } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [biography, portrait] = await Promise.all([getBiography(), getPortraitUrl().catch(() => null)]);
  const description = biography.lead
    ? truncate(stripRichText(biography.lead), 160)
    : `Découvrez ${SITE_NAME} et sa démarche de transmission à travers des ressources gratuites.`;
  return {
    title: "À propos",
    description,
    alternates: { canonical: "/a-propos" },
    openGraph: {
      title: `À propos — ${SITE_NAME}`,
      description,
      url: "/a-propos",
      type: "profile",
      images: portrait ? [{ url: portrait, alt: SITE_NAME }] : undefined,
    },
  };
}

// Contenus modifiables dans Admin > Parametres. Un champ vide masque sa section.
export default async function AboutPage() {
  const [biography, latest] = await Promise.all([getBiography(), getLatestResources(3)]);

  return (
    <>
      <section className="bg-ivory-100">
        <Container className="pt-10 pb-16 md:pt-14 md:pb-24">
          <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "À propos" }]} />

          <div className="mt-10 grid items-start gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <div className="relative mx-auto w-full max-w-sm md:sticky md:top-28 md:max-w-none">
              <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-3xl border border-gold-500/60" />
              <Portrait priority className="relative aspect-[4/5] w-full rounded-3xl" />
            </div>

            <div className="space-y-8">
              <Eyebrow>À propos</Eyebrow>
              <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.02em] text-navy-900">
                {SITE_NAME}
              </h1>
              {biography.title ? (
                <p className="font-display text-2xl italic leading-snug text-navy-700 md:text-3xl">
                  <MultilineText text={biography.title} />
                </p>
              ) : null}
              {biography.lead ? (
                <p className="text-pretty text-lg leading-relaxed text-ink-700 md:text-xl">
                  <MultilineText text={biography.lead} />
                </p>
              ) : null}
              {biography.body ? (
                <div className="prose-editorial border-t border-navy-900/10 pt-8 text-[1.05rem] leading-[1.8] text-ink-700">
                  <RichText text={biography.body} />
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {biography.quote ? (
        <section className="bg-navy-900 py-20 md:py-28">
          <Container className="max-w-4xl text-center">
            <span aria-hidden className="mx-auto mb-8 block h-px w-14 bg-gold-500" />
            <blockquote className="font-display text-balance text-[clamp(1.6rem,3.4vw,2.5rem)] font-light italic leading-[1.3] text-ivory-100">
              {biography.quote}
            </blockquote>
            {biography.quoteSource ? (
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">{biography.quoteSource}</p>
            ) : null}
          </Container>
        </section>
      ) : null}

      {biography.approach ? (
        <section className="bg-white py-20 md:py-28">
          <Container className="grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
            <SectionHeading eyebrow="Transmission" title="Ma démarche" />
            <div className="prose-editorial text-[1.05rem] leading-[1.8] text-ink-700">
              <RichText text={biography.approach} />
            </div>
          </Container>
        </section>
      ) : null}

      <section className="bg-ivory-100 py-20 md:py-28">
        <Container>
          <SectionHeading
            eyebrow="Les ressources"
            title="Explorer l'espace média"
            description="Toutes les ressources sont accessibles gratuitement."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTION_LIST.map((section) => (
              <li key={section.section}>
                <Link
                  href={section.path}
                  className="group flex h-full items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-navy-900/[0.07] transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(20,38,61,0.55)]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-gold-300">
                    <TypeIcon type={section.type} className="h-6 w-6" />
                  </span>
                  <span className="flex-1 font-display text-xl text-navy-900">{section.label}</span>
                  <ArrowRightIcon className="h-4 w-4 text-navy-900 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>

          {latest.length > 0 ? (
            <div className="mt-20">
              <SectionHeading title="Contenus récents" action={{ href: "/recherche", label: "Toutes les ressources" }} />
              <div className="mt-10">
                <ResourceGrid resources={latest} showType />
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
