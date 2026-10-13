import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFile, readStoredFileHead } from "@/lib/storage";
import { HEAD_BYTES, isUploadKind, matchesSignature, signatureErrorMessage, UPLOAD_RULES } from "@/lib/file-validation";

/**
 * Etape 2 d'un envoi direct : verifie le contenu reel du fichier depose sur le
 * stockage (signature des premiers octets). Un fichier dont le contenu ne
 * correspond pas a son extension est supprime.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { kind?: unknown; url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url : "";
  const kind = body?.kind;
  if (!isUploadKind(kind) || !url) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  // le dossier doit correspondre au type annonce : empeche de viser (et de
  // supprimer) un fichier d'une autre nature
  if (!url.includes(`/${UPLOAD_RULES[kind].folder}/`)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const head = await readStoredFileHead(url, HEAD_BYTES);
  if (!head) {
    return NextResponse.json({ error: "Fichier introuvable après l'envoi. Réessayez." }, { status: 400 });
  }

  const pathname = decodeURIComponent(new URL(url, "http://local").pathname);
  if (!matchesSignature(kind, pathname, head)) {
    await deleteFile(url).catch(() => {});
    return NextResponse.json({ error: signatureErrorMessage(kind) }, { status: 400 });
  }

  return NextResponse.json({ url });
}
