import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { getBiography, getPortraitUrl, getSiteIdentity } from "@/lib/settings";
import { PortraitSettingsForm } from "@/components/admin/PortraitSettingsForm";
import { BiographySettingsForm } from "@/components/admin/BiographySettingsForm";
import { IdentitySettingsForm } from "@/components/admin/IdentitySettingsForm";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [portraitUrl, biography, identity] = await Promise.all([getPortraitUrl(), getBiography(), getSiteIdentity()]);

  return (
    <div className="max-w-6xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-medium text-navy-900">Paramètres du site</h1>
        <p className="mt-1 text-sm text-ink-500">Réservé aux administrateurs.</p>
      </div>

      <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-medium text-navy-900">Photo de Jean-Marc GNALI</h2>
        <p className="mt-1 text-sm text-ink-500">
          Affichée sur la page d&apos;accueil et sur la page À propos. Privilégiez une photo authentique en portrait
          (verticale), de bonne qualité, le visage dans le tiers supérieur.
        </p>
        <div className="mt-6">
          <PortraitSettingsForm currentUrl={portraitUrl} />
        </div>
      </div>

      <div id="biographie" className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-medium text-navy-900">Page À propos</h2>
        <p className="mt-1 text-sm text-ink-500">
          Textes de la page{" "}
          <a href="/a-propos" target="_blank" rel="noreferrer" className="text-navy-900 underline">
            À propos
          </a>
          . Le nom affiché est toujours « Jean-Marc GNALI ». Chaque section laissée vide est masquée.
        </p>
        <div className="mt-6">
          <BiographySettingsForm initial={biography} />
        </div>
      </div>

      <div id="identite" className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-medium text-navy-900">Présentation et réseaux sociaux</h2>
        <p className="mt-1 text-sm text-ink-500">Affichés dans le pied de page de toutes les pages publiques.</p>
        <div className="mt-6">
          <IdentitySettingsForm intro={identity.intro} socials={identity.socialValues} />
        </div>
      </div>
    </div>
  );
}
