import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-14 pb-24 md:pt-20">
      <Container className="prose-editorial max-w-2xl space-y-4 text-justify hyphens-auto text-ink-700 md:text-left">
        <h1 className="text-center font-display text-4xl font-medium text-navy-900">
          Politique de confidentialité
        </h1>
        <p>
          Le site utilise des cookies techniques strictement nécessaires : l&apos;un
          évite de comptabiliser plusieurs fois la consultation d&apos;une même
          ressource par un même visiteur, l&apos;autre (identifiant aléatoire)
          mémorise les mentions « J&apos;aime » données de façon anonyme. Aucune
          donnée personnelle n&apos;est collectée au-delà de ce qui est nécessaire
          au bon fonctionnement du site.
        </p>
        <p>
          Les lecteurs YouTube, Vimeo et Spotify ne sont chargés qu&apos;après un
          clic sur le bouton de lecture correspondant. Ces services peuvent alors
          déposer leurs propres cookies, selon leurs politiques respectives.
        </p>
        <p>
          Ce texte est un modèle à compléter et valider avec le propriétaire
          de la plateforme avant mise en production, notamment concernant les
          obligations légales applicables (RGPD ou autre réglementation
          locale).
        </p>
      </Container>
    </div>
  );
}
