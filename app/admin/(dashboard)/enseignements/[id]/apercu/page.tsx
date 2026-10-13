import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/public/ResourceDetail";
import { StatusBadge } from "@/components/ui/Badge";
import { getResourceForPreview } from "@/lib/resources";
import { TYPE_TO_SECTION } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Aperçu",
  robots: { index: false, follow: false },
};

/** Apercu d'une ressource telle qu'elle apparaitra sur le site, quel que soit son statut. */
export default async function PreviewResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResourceForPreview(id);
  if (!resource) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-500/40 bg-gold-100 px-5 py-3 text-sm text-navy-900">
        <p className="flex flex-wrap items-center gap-2">
          <strong>Aperçu</strong> — voici la fiche telle qu&apos;elle apparaîtra sur le site.
          <StatusBadge status={resource.status} />
        </p>
        <Link href={`/admin/enseignements/${resource.id}/modifier`} className="font-semibold underline-offset-4 hover:underline">
          ← Retour à la modification
        </Link>
      </div>
      <div className="-mx-4 overflow-hidden rounded-2xl bg-ivory-100 font-sans ring-1 ring-ink-900/10 sm:mx-0">
        <ResourceDetail resource={resource} section={TYPE_TO_SECTION[resource.type]} related={[]} preview />
      </div>
    </div>
  );
}
