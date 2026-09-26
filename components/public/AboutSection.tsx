import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PastorPortrait } from "@/components/public/PastorPortrait";
import { MultilineText } from "@/components/ui/RichText";
import { getBiography } from "@/lib/settings";

export async function AboutSection() {
  const { title } = await getBiography();

  return (
    <section className="bg-ivory-100 py-28">
      <Container className="grid items-center gap-16 md:grid-cols-2">
        <div className="order-2 text-center md:order-1">
          <Eyebrow centered>À propos</Eyebrow>
          <h2 className="mt-6 font-display text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] text-navy-900">
            <MultilineText text={title} />
          </h2>
          <div className="prose-editorial mx-auto mt-6 space-y-5 text-justify text-base leading-relaxed text-ink-700 hyphens-auto md:text-center">
            <p>
              Le Pasteur Jean-Marc GNALI consacre son ministère à l&apos;enseignement
              de la Parole, avec le désir constant de rendre accessible une
              compréhension profonde de la foi.
            </p>
            <p>
              Chaque enseignement porte une même conviction : la transformation
              commence par une compréhension nouvelle, et cette compréhension
              mérite d&apos;être transmise avec clarté et sincérité.
            </p>
          </div>
          <Button href="/a-propos" variant="outline" className="mt-8">
            Lire son parcours
          </Button>
        </div>

        <div className="order-1 md:order-2">
          <PastorPortrait className="aspect-[4/5] w-full rounded-3xl" />
        </div>
      </Container>
    </section>
  );
}
