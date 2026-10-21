import type { Metadata } from "next";
import { AppAboutContent } from "@/components/AppAboutContent";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.about.metaTitle,
  robots: { index: false, follow: false },
};

/**
 * À propos de l'application : identite et version, encart « Réalisé par
 * Solutione ». Protegee comme le reste de l'espace admin (layout + proxy).
 * Meme contenu que la page publique /version.
 */
export default function AdminAboutPage() {
  return <AppAboutContent />;
}
