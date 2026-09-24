import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { MultilineText, RichText } from "@/components/ui/RichText";
import { PastorPortrait } from "@/components/public/PastorPortrait";
import { QuoteSection } from "@/components/public/QuoteSection";
import { getBiography } from "@/lib/settings";

export const metadata: Metadata = {
  title: "A propos",
  description: "Le parcours, la mission et la vision du Pasteur Jean-Marc GNALI.",
  alternates: { canonical: "/a-propos" },
};

// Contenu modifiable dans Admin > Parametres > Biographie
export default async function AboutPage() {
  const biography = await getBiography();

  return (
    <div className="pt-32">
      <section className="bg-navy-950 pb-24">
        <Container className="max-w-3xl">
          <Eyebrow light>A propos</Eyebrow>
          <h1 className="mt-6 font-display text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] text-ivory-100">
            <MultilineText text={biography.title} />
          </h1>
        </Container>
      </section>

      <section className="bg-ivory-100 py-24">
        <Container className="grid items-start gap-16 md:grid-cols-[1fr_1.2fr]">
          <PastorPortrait className="aspect-[3/4] w-full rounded-3xl md:sticky md:top-28" />

          <div className="prose-editorial space-y-6 text-lg leading-relaxed text-ink-700">
            {biography.lead ? (
              <p className="font-display text-2xl font-semibold leading-snug text-navy-900">
                <MultilineText text={biography.lead} />
              </p>
            ) : null}
            {biography.body ? <RichText text={biography.body} /> : null}
          </div>
        </Container>
      </section>

      {biography.quote ? (
        <QuoteSection quote={biography.quote} source={biography.quoteSource || undefined} />
      ) : null}
    </div>
  );
}
