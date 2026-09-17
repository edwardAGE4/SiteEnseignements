import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PortraitPlaceholder } from "@/components/public/PortraitPlaceholder";
import { QuoteSection } from "@/components/public/QuoteSection";

export const metadata: Metadata = {
  title: "A propos",
  description: "Le parcours, la mission et la vision du Pasteur Jean-Marc GNALI.",
  alternates: { canonical: "/a-propos" },
};

export default function AboutPage() {
  return (
    <div className="pt-32">
      <section className="bg-navy-950 pb-24">
        <Container className="max-w-3xl">
          <Eyebrow light>A propos</Eyebrow>
          <h1 className="mt-6 font-display text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] text-ivory-100">
            Une mission.
            <br />
            Une transmission.
          </h1>
        </Container>
      </section>

      <section className="bg-ivory-100 py-24">
        <Container className="grid gap-16 md:grid-cols-[1fr_1.2fr]">
          <PortraitPlaceholder className="aspect-[3/4] w-full rounded-3xl" />

          <div className="prose-editorial space-y-6 text-lg leading-relaxed text-ink-700">
            <p className="font-display text-2xl font-semibold leading-snug text-navy-900">
              Un contenu a completer par le proprietaire du site.
            </p>
            <p>
              Cette page est prevue pour accueillir le parcours, la vision et la
              vocation d&apos;enseignement du Pasteur Jean-Marc GNALI, redige a la
              maniere d&apos;un recit editorial plutot que d&apos;une fiche
              administrative.
            </p>
            <p>
              Conformement aux exigences du projet, aucune information
              biographique n&apos;a ete inventee : le texte definitif doit etre
              fourni par le Pasteur Jean-Marc GNALI ou par le proprietaire de la
              plateforme, puis integre ici.
            </p>
          </div>
        </Container>
      </section>

      <QuoteSection quote="La transmission commence toujours par une comprehension nouvelle." />
    </div>
  );
}
