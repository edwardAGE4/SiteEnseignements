import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFile, readStoredFileHead } from "@/lib/storage";
import { detectImageType, isPdfBuffer } from "@/lib/file-validation";

/**
 * Etape 2 d'un envoi direct : verifie le contenu reel du fichier depose sur le
 * stockage (signature des premiers octets). Un fichier qui n'est pas une vraie
 * image / un vrai PDF est supprime.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { kind?: string; url?: string } | null;
  const url = typeof body?.url === "string" ? body.url : "";
  if ((body?.kind !== "image" && body?.kind !== "pdf") || !url) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  // le dossier doit correspondre au type annonce : empeche de viser (et de
  // supprimer) un fichier d'une autre nature
  if (!url.includes(body.kind === "pdf" ? "/documents/" : "/images/")) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const head = await readStoredFileHead(url);
  if (!head) {
    return NextResponse.json({ error: "Fichier introuvable après l'envoi. Réessayez." }, { status: 400 });
  }

  const valid = body.kind === "pdf" ? isPdfBuffer(head) : detectImageType(head) !== null;
  if (!valid) {
    await deleteFile(url).catch(() => {});
    return NextResponse.json(
      {
        error:
          body.kind === "pdf"
            ? "Le fichier fourni n'est pas un PDF valide."
            : "Format d'image non reconnu. Formats acceptés : JPEG, PNG, WebP.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ url });
}
