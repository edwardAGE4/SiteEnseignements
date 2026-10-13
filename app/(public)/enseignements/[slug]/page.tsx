import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resourcePath } from "@/lib/sections";

/**
 * Ancienne URL d'un enseignement (/enseignements/<slug>) : redirection
 * permanente vers la fiche de la ressource dans sa rubrique, pour conserver
 * les liens partages et le referencement.
 */
export default async function LegacyTeachingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { type: true, slug: true },
  });

  if (!resource) notFound();
  permanentRedirect(resourcePath(resource));
}
