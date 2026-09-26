import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { isPdfBuffer, validatePdfUpload } from "@/lib/file-validation";
import { exceedsRate } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (exceedsRate(`upload-pdf:${session.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Trop d'envois en peu de temps. Patientez une minute." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }

  const sizeError = validatePdfUpload(file);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!isPdfBuffer(buffer)) {
    return NextResponse.json(
      { error: "Le fichier fourni n'est pas un PDF valide." },
      { status: 400 },
    );
  }

  const url = await uploadFile(buffer, file.name, "application/pdf", "documents");
  return NextResponse.json({ url, fileName: file.name });
}
