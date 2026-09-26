import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-32 pb-28">
      <Container className="prose-editorial max-w-2xl space-y-4 text-justify hyphens-auto text-ink-700 md:text-left">
        <h1 className="text-center font-display text-3xl font-semibold text-navy-900">
          Politique de confidentialité
        </h1>
        <p>
          La plateforme utilise un cookie technique strictement nécessaire pour
          éviter de comptabiliser plusieurs fois la consultation d&apos;un même
          enseignement par un même visiteur. Aucune donnée personnelle
          n&apos;est collectée au-delà de ce qui est nécessaire au bon
          fonctionnement du site.
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
