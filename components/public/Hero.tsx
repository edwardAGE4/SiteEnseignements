import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PastorPortrait } from "@/components/public/PastorPortrait";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-end overflow-hidden bg-navy-950">
      <PastorPortrait className="absolute inset-0" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/10" />

      <Container className="relative z-10 pb-24 pt-40 md:pb-32">
        <div className="mx-auto max-w-3xl animate-fade-up text-center">
          <span className="flex items-center justify-center gap-3 font-accent text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">
            <span className="h-px w-10 shrink-0 bg-gold-400" />
            Ministère d&apos;enseignement
            <span className="h-px w-10 shrink-0 bg-gold-400" />
          </span>

          <h1 className="mt-6 font-display text-balance text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[1.02] text-ivory-100">
            Pasteur Jean-Marc GNALI
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance font-sans text-lg leading-relaxed text-ivory-100/80 md:text-xl">
            Des enseignements pour comprendre, grandir et transmettre.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/enseignements" variant="gold">
              Découvrir les enseignements
            </Button>
            <Button href="/a-propos" variant="ghost" className="border border-ivory-100/30">
              À propos du Pasteur
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
