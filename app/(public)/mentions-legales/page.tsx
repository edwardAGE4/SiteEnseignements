import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

export default function LegalNoticePage() {
  return (
    <div className="pt-32 pb-28">
      <Container className="prose-editorial max-w-2xl space-y-4 text-justify hyphens-auto text-ink-700 md:text-left">
        <h1 className="text-center font-display text-3xl font-semibold text-navy-900">Mentions légales</h1>
        <p>
          Cette page est un modèle à compléter avec les informations légales
          officielles du propriétaire de la plateforme (éditeur du site,
          hébergeur, directeur de publication, coordonnées de contact).
        </p>
        <p>
          Aucune information n&apos;a été inventée ici : merci de fournir le
          texte définitif avant la mise en production du site.
        </p>
      </Container>
    </div>
  );
}
