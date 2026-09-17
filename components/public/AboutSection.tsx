import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PortraitPlaceholder } from "@/components/public/PortraitPlaceholder";

export function AboutSection() {
  return (
    <section className="bg-ivory-100 py-28">
      <Container className="grid items-center gap-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <Eyebrow>A propos</Eyebrow>
          <h2 className="mt-6 font-display text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] text-navy-900">
            Une mission.
            <br />
            Une transmission.
          </h2>
          <div className="prose-editorial mt-6 space-y-5 text-base leading-relaxed text-ink-700">
            <p>
              Le Pasteur Jean-Marc GNALI consacre son ministere a l&apos;enseignement
              de la Parole, avec le desir constant de rendre accessible une
              comprehension profonde de la foi.
            </p>
            <p>
              Chaque enseignement porte une meme conviction : la transformation
              commence par une comprehension nouvelle, et cette comprehension
              merite d&apos;etre transmise avec clarte et sincerite.
            </p>
          </div>
          <Button href="/a-propos" variant="outline" className="mt-8">
            Lire son parcours
          </Button>
        </div>

        <div className="order-1 md:order-2">
          <PortraitPlaceholder className="aspect-[4/5] w-full rounded-3xl" />
        </div>
      </Container>
    </section>
  );
}
