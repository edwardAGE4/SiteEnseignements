import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { backendForUrl, getRemoteFileUrl, readLocalFile } from "@/lib/storage";

/**
 * Sert un document PDF d'un enseignement (?doc=<id>) depuis le domaine du site.
 * - par defaut : affichage dans le lecteur PDF du navigateur (inline)
 * - ?mode=telechargement : telechargement du fichier (attachment)
 * En stockage local, le fichier est relu cote serveur (meme domaine, pas de
 * probleme CORS) ; en stockage distant, redirection vers le fichier.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const download = request.nextUrl.searchParams.get("mode") === "telechargement";
  const documentId = request.nextUrl.searchParams.get("doc");

  const teaching = await prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      // sans ?doc= : premier document (compatibilite avec les anciens liens)
      documents: {
        where: documentId ? { id: documentId } : undefined,
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true, fileName: true },
      },
    },
  });

  const document = teaching?.documents[0];
  if (!teaching || !document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!isRateLimited(`telechargement:${ip}:${slug}:${documentId ?? ""}`, 10_000)) {
    await prisma.teaching.update({
      where: { id: teaching.id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  const fileName = /\.pdf$/i.test(document.fileName) ? document.fileName : `${document.fileName}.pdf`;

  // Fichier sur Vercel Blob ou S3 : redirection (les reponses des fonctions
  // sont limitees a 4,5 Mo sur Vercel, un PDF ne doit donc pas transiter par ici).
  if (backendForUrl(document.url) !== "local") {
    return NextResponse.redirect(await getRemoteFileUrl(document.url, fileName, download), 307);
  }

  const file = await readLocalFile(document.url);
  if (!file) {
    return NextResponse.json({ error: "Fichier PDF introuvable sur le serveur" }, { status: 404 });
  }

  return new NextResponse(file as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.byteLength),
      "Content-Disposition": contentDisposition(download ? "attachment" : "inline", fileName),
      "Cache-Control": "public, max-age=300",
    },
  });
}

/** En-tete Content-Disposition compatible avec les noms de fichier accentues. */
function contentDisposition(type: "inline" | "attachment", fileName: string) {
  const asciiName = fileName.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "document.pdf";
  return `${type}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
