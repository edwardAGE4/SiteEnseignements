import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Mentions legales",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  return (
    <div className="pt-32 pb-28">
      <Container className="prose-editorial max-w-2xl space-y-4 text-ink-700">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Mentions legales</h1>
        <p>
          Cette page est un modele a completer avec les informations legales
          officielles du proprietaire de la plateforme (editeur du site,
          hebergeur, directeur de publication, coordonnees de contact).
        </p>
        <p>
          Aucune information n&apos;a ete inventee ici : merci de fournir le
          texte definitif avant la mise en production du site.
        </p>
      </Container>
    </div>
  );
}
