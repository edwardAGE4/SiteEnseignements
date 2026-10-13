"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

/** Erreur inattendue sur une page publique : message clair, sans detail technique. */
export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-24 text-center md:py-32">
      <span aria-hidden className="h-px w-12 bg-gold-500" />
      <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] font-medium text-navy-900">
        Cette page est momentanément indisponible
      </h1>
      <p className="mt-4 max-w-md text-ink-500">
        Une erreur est survenue lors du chargement. Réessayez dans quelques instants.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button href="/" variant="outline">
          Retour à l&apos;accueil
        </Button>
      </div>
    </Container>
  );
}
