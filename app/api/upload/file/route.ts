import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { exceedsRate } from "@/lib/rate-limit";
import {
  HEAD_BYTES,
  isUploadKind,
  matchesSignature,
  mimeTypeFor,
  signatureErrorMessage,
  UPLOAD_RULES,
  validateUpload,
} from "@/lib/file-validation";

/**
 * Envoi d'un fichier via le serveur (stockage local en developpement).
 * En production, les fichiers partent directement du navigateur vers le
 * stockage (cf. /api/upload/sign), sans passer par cette route.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (exceedsRate(`upload-server:${session.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Trop d'envois en peu de temps. Patientez une minute." }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  const kind = formData?.get("kind");
  const file = formData?.get("file");

  if (!isUploadKind(kind) || !(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }

  const validationError = validateUpload(kind, file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(kind, file.name, buffer.subarray(0, HEAD_BYTES))) {
    return NextResponse.json({ error: signatureErrorMessage(kind) }, { status: 400 });
  }

  try {
    const url = await uploadFile(buffer, file.name, mimeTypeFor(kind, file.name)!, UPLOAD_RULES[kind].folder);
    return NextResponse.json({ url, fileName: file.name });
  } catch (error) {
    console.error("[upload] Échec de l'enregistrement du fichier :", error);
    return NextResponse.json({ error: "Le fichier n'a pas pu être enregistré. Réessayez." }, { status: 500 });
  }
}
