import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { BLOB_PATHNAME_PATTERN, getBlobToken } from "@/lib/storage";

/**
 * Autorise un envoi direct navigateur -> Vercel Blob (contourne la limite de
 * 4,5 Mo des fonctions Vercel). Le jeton d'envoi n'est delivre qu'a un
 * utilisateur connecte, pour un chemin, un type et une taille controles.
 */
const LIMITS = {
  image: { folder: "images/", types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 8 * 1024 * 1024 },
  pdf: { folder: "documents/", types: ["application/pdf"], maxBytes: 20 * 1024 * 1024 },
} as const;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      token: getBlobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user) throw new Error("Non autorise.");

        const limits = clientPayload === "image" || clientPayload === "pdf" ? LIMITS[clientPayload] : null;
        if (!limits || !BLOB_PATHNAME_PATTERN.test(pathname) || !pathname.startsWith(limits.folder)) {
          throw new Error("Chemin d'envoi invalide.");
        }

        return {
          allowedContentTypes: [...limits.types],
          maximumSizeInBytes: limits.maxBytes,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Envoi refuse.";
    // store cree en "prive" : les fichiers du site doivent etre lisibles publiquement
    const hint = /access|private/i.test(message)
      ? " Le store Vercel Blob doit etre PUBLIC pour afficher les images et PDF du site."
      : "";
    return NextResponse.json({ error: `${message}${hint}` }, { status: 400 });
  }
}
