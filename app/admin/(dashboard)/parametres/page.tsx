import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { DEFAULT_BIOGRAPHY, getPastorPortraitUrl, getSavedBiography } from "@/lib/settings";
import { PortraitSettingsForm } from "@/components/admin/PortraitSettingsForm";
import { BiographySettingsForm } from "@/components/admin/BiographySettingsForm";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [portraitUrl, savedBiography] = await Promise.all([getPastorPortraitUrl(), getSavedBiography()]);

  return (
    <div className="max-w-6xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Paramètres du site</h1>
        <p className="mt-1 text-sm text-ink-500">Réservé aux administrateurs.</p>
      </div>

      <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-900">Photo du Pasteur Jean-Marc GNALI</h2>
        <p className="mt-1 text-sm text-ink-500">
          Affichée en grand sur la page d&apos;accueil, dans la section de présentation et sur la page À propos.
          Privilégiez une photo en portrait (verticale), de bonne qualité, le visage dans le tiers supérieur.
        </p>
        <div className="mt-6">
          <PortraitSettingsForm currentUrl={portraitUrl} />
        </div>
      </div>

      <div id="biographie" className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-900">Biographie (page À propos)</h2>
        <p className="mt-1 text-sm text-ink-500">
          Titre, introduction, parcours détaillé et citation affichés sur la page{" "}
          <a href="/a-propos" target="_blank" rel="noreferrer" className="text-navy-900 underline">
            À propos
          </a>
          . Le titre apparaît aussi dans la section de présentation de l&apos;accueil.
        </p>
        <div className="mt-6">
          <BiographySettingsForm initial={savedBiography ?? DEFAULT_BIOGRAPHY} />
        </div>
      </div>
    </div>
  );
}
