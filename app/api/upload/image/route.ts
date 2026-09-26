import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { detectImageType, validateImageUpload } from "@/lib/file-validation";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (isRateLimited(`upload-image:${session.user.id}`, 2_000)) {
    return NextResponse.json({ error: "Veuillez patienter avant un nouvel envoi." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }

  const sizeError = validateImageUpload(file);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageType(buffer);

  if (!mimeType) {
    return NextResponse.json(
      { error: "Format d'image non reconnu. Formats acceptés : JPEG, PNG, WebP." },
      { status: 400 },
    );
  }

  const url = await uploadFile(buffer, file.name, mimeType, "images");
  return NextResponse.json({ url });
}
