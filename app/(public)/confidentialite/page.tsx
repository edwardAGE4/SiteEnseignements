import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-32 pb-28">
      <Container className="prose-editorial max-w-2xl space-y-4 text-ink-700">
        <h1 className="font-display text-3xl font-semibold text-navy-900">
          Politique de confidentialite
        </h1>
        <p>
          La plateforme utilise un cookie technique strictement necessaire pour
          eviter de comptabiliser plusieurs fois la consultation d&apos;un meme
          enseignement par un meme visiteur. Aucune donnee personnelle
          n&apos;est collectee au-dela de ce qui est necessaire au bon
          fonctionnement du site.
        </p>
        <p>
          Ce texte est un modele a completer et valider avec le proprietaire
          de la plateforme avant mise en production, notamment concernant les
          obligations legales applicables (RGPD ou autre reglementation
          locale).
        </p>
      </Container>
    </div>
  );
}
