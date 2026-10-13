import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { Portrait } from "@/components/public/Portrait";

/**
 * Section d'accueil. Le titre et le texte d'introduction sont reproduits
 * a l'identique (texte fourni par Jean-Marc GNALI) : ne pas les reformuler.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ivory-100">
      {/* motif discret en fond */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,#0052d124,transparent_65%)]"
      />
      <Container className="relative grid items-center gap-12 pt-12 pb-16 md:pt-16 md:pb-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20 lg:pt-20 lg:pb-28">
        <div className="animate-fade-up">
          <span aria-hidden className="block h-px w-14 bg-gold-500" />
          <h1 className="mt-8 font-display text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.1] text-navy-900">
            Bienvenue sur
            <br />
            <span className="text-navy-700">mon espace média</span>
          </h1>

          <div className="mt-8 max-w-[38rem] space-y-5 text-[1.075rem] leading-[1.75] text-ink-700 md:text-lg">
            <p>
              Je mets{" "}
              <strong className="font-semibold tracking-[0.04em] text-navy-900 underline decoration-gold-500 decoration-2 underline-offset-[6px]">
                GRATUITEMENT
              </strong>{" "}
              à votre disposition un certain nombre de ressources multiformats qui peuvent vous être profitables pour
              vous aider dans différents domaines.
            </p>
            <p>J’ajoute régulièrement pour vous du contenu que je trouve utile, édifiant et/ou pratique.</p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/#ressources" className="group">
              Explorer les ressources
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button href="/a-propos" variant="outline">
              À propos
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[24rem] animate-fade-in lg:max-w-none">
          <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-t-[12rem] rounded-b-3xl border border-gold-500/60" />
          <Portrait priority className="relative aspect-[4/5] w-full rounded-t-[12rem] rounded-b-3xl shadow-[0_40px_80px_-50px_rgba(20,38,61,0.7)]" />
        </div>
      </Container>
    </section>
  );
}
