import { Container } from "@/components/ui/Container";

export function QuoteSection({ quote, source }: { quote: string; source?: string }) {
  return (
    <section className="bg-navy-900 py-28">
      <Container className="max-w-4xl text-center">
        <span className="mx-auto mb-8 block h-px w-16 bg-gold-400" />
        <blockquote className="font-display text-balance text-[clamp(1.75rem,3.6vw,2.75rem)] font-medium leading-[1.25] text-ivory-100">
          {quote}
        </blockquote>
        {source ? (
          <p className="mt-8 font-accent text-sm uppercase tracking-[0.25em] text-gold-300">
            {source}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
