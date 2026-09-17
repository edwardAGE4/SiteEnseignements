import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PortraitPlaceholder } from "@/components/public/PortraitPlaceholder";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-end overflow-hidden bg-navy-950">
      <PortraitPlaceholder className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/10" />

      <Container className="relative z-10 pb-24 pt-40 md:pb-32">
        <div className="max-w-3xl animate-fade-up">
          <span className="flex items-center gap-3 font-accent text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">
            <span className="h-px w-10 bg-gold-400" />
            Ministere d&apos;enseignement
          </span>

          <h1 className="mt-6 font-display text-balance text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[1.02] text-ivory-100">
            Pasteur Jean-Marc GNALI
          </h1>

          <p className="mt-6 max-w-xl text-balance font-sans text-lg leading-relaxed text-ivory-100/80 md:text-xl">
            Des enseignements pour comprendre, grandir et transmettre.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/enseignements" variant="gold">
              Decouvrir les enseignements
            </Button>
            <Button href="/a-propos" variant="ghost" className="border border-ivory-100/30">
              A propos du Pasteur
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
