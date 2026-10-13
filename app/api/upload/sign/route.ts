import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exceedsRate } from "@/lib/rate-limit";
import { buildBlobPathname, createDirectUpload, getUploadBackends } from "@/lib/storage";
import { isUploadKind, mimeTypeFor, UPLOAD_RULES, validateUpload } from "@/lib/file-validation";

/**
 * Etape 1 d'un envoi de fichier.
 * - Vercel Blob (principal) : renvoie le chemin du fichier ; le navigateur l'envoie
 *   via le SDK. S'il echoue (store plein...), il rappelle cette route avec
 *   fallback=true pour obtenir un envoi vers S3 (Supabase, secours).
 * - Stockage distant (S3 / Supabase) : renvoie une URL pre-signee pour que le
 *   navigateur envoie le fichier directement au stockage, sans passer par la
 *   fonction serveur (limitee a 4,5 Mo sur Vercel).
 * - Stockage local : indique la route qui recoit le fichier.
 * Le type MIME est deduit de l'extension (liste blanche), jamais de la
 * declaration du navigateur.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    kind?: unknown;
    fileName?: unknown;
    size?: unknown;
    /** true apres un echec Vercel Blob (store plein...) : utiliser le stockage de secours */
    fallback?: boolean;
  } | null;

  const kind = body?.kind;
  if (!isUploadKind(kind) || typeof body?.fileName !== "string" || typeof body.size !== "number") {
    return NextResponse.json({ error: "Requête d'envoi invalide." }, { status: 400 });
  }

  const validationError = validateUpload(kind, { name: body.fileName, size: body.size });
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const rule = UPLOAD_RULES[kind];
  const contentType = mimeTypeFor(kind, body.fileName)!;

  const backends = getUploadBackends().filter((backend) => !(body.fallback && backend === "blob"));
  const backend = backends[0];

  if (!backend) {
    console.error(
      body.fallback
        ? "[upload] Vercel Blob a refusé l'envoi et aucun stockage de secours S3 n'est configuré."
        : "[upload] Aucun stockage configuré : connectez un store Vercel Blob au projet (et/ou les variables S3_*).",
    );
    return NextResponse.json(
      {
        error: body.fallback
          ? "Le stockage principal est plein ou indisponible et aucun stockage de secours n'est configuré."
          : "Stockage des fichiers non configuré sur le serveur.",
      },
      { status: 503 },
    );
  }

  if (backend === "local") {
    return NextResponse.json({ mode: "server", endpoint: "/api/upload/file" });
  }

  if (exceedsRate(`upload:${session.user.id}`, 40, 60_000)) {
    return NextResponse.json({ error: "Trop d'envois en peu de temps. Patientez une minute." }, { status: 429 });
  }

  if (backend === "blob") {
    // Vercel Blob : le navigateur obtient son jeton d'envoi via /api/upload/blob.
    // canFallback : le navigateur pourra retenter sur S3 si Blob refuse.
    return NextResponse.json({
      mode: "blob",
      pathname: buildBlobPathname(rule.folder, body.fileName),
      handleUploadUrl: "/api/upload/blob",
      contentType,
      canFallback: backends.includes("s3"),
    });
  }

  try {
    const { uploadUrl, publicUrl } = await createDirectUpload(rule.folder, body.fileName, contentType);
    return NextResponse.json({ mode: "direct", uploadUrl, publicUrl, contentType });
  } catch (error) {
    console.error("[upload] URL pre-signee impossible :", error);
    return NextResponse.json(
      { error: "Stockage des fichiers mal configuré (variables S3_*). Contactez l'administrateur." },
      { status: 500 },
    );
  }
}
