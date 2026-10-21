import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { AppAboutContent } from "@/components/AppAboutContent";
import { t } from "@/lib/i18n";

// regeneree chaque jour (annee du « © »)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: t.about.publicTitle,
  description: t.about.publicDescription,
  alternates: { canonical: "/version" },
};

/**
 * Version et mises a jour du site (lien « Informations » du pied de page) :
 * meme contenu que la page À propos de l'administration.
 */
export default function VersionPage() {
  return (
    <Container className="py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: t.about.publicTitle }]} />
      <div className="mt-8">
        <AppAboutContent />
      </div>
    </Container>
  );
}
