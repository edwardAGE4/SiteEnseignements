import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { backendForUrl, getRemoteFileUrl, readLocalFile } from "@/lib/storage";
import { fileExtension, UPLOAD_RULES } from "@/lib/file-validation";

/**
 * Sert un fichier joint a une ressource publiee (?doc=<id>) depuis le domaine du site.
 * - par defaut : consultation dans le navigateur (inline)
 * - ?mode=telechargement : telechargement (attachment)
 * Ressources en consultation seule (VIEW_ONLY) : refuse, voir la route /consulter.
 * Les ressources en brouillon ou archivees ne servent aucun fichier.
 * En stockage local, le fichier est relu cote serveur ; en stockage distant,
 * redirection vers le fichier.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const documentId = request.nextUrl.searchParams.get("doc");

  const resource = await prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    select: {
      id: true,
      downloadPolicy: true,
      // sans ?doc= : premier document (compatibilite avec les anciens liens)
      documents: {
        where: documentId ? { id: documentId } : undefined,
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true, fileName: true, mimeType: true },
      },
    },
  });

  const document = resource?.documents[0];
  if (!resource || !document) {
    return NextResponse.json({ error: "Ce fichier n'est pas disponible." }, { status: 404 });
  }

  // Consultation seule : le fichier n'est jamais servi tel quel (ni lien direct,
  // ni lecteur du navigateur) ; il se lit dans le lecteur integre (route /consulter).
  if (resource.downloadPolicy !== "DOWNLOAD") {
    return NextResponse.json(
      { error: "Ce document se consulte uniquement depuis la page de la ressource." },
      { status: 403 },
    );
  }

  const download = request.nextUrl.searchParams.get("mode") === "telechargement";

  const ip = clientIp(request.headers);
  if (!isRateLimited(`telechargement:${ip}:${slug}:${documentId ?? ""}`, 10_000)) {
    await prisma.teaching
      .update({ where: { id: resource.id }, data: { downloadCount: { increment: 1 } } })
      .catch((error) => console.error("[telechargement] compteur non mis a jour :", error));
  }

  const storedExtension = fileExtension(document.url);
  const fileName =
    fileExtension(document.fileName) || !storedExtension ? document.fileName : `${document.fileName}.${storedExtension}`;

  // Fichier sur Vercel Blob ou S3 : redirection (les reponses des fonctions
  // sont limitees a 4,5 Mo sur Vercel, un fichier ne doit donc pas transiter par ici).
  if (backendForUrl(document.url) !== "local") {
    return NextResponse.redirect(await getRemoteFileUrl(document.url, fileName, download), 307);
  }

  const file = await readLocalFile(document.url);
  if (!file) {
    return NextResponse.json({ error: "Ce fichier est introuvable. Il a peut-être été retiré." }, { status: 404 });
  }

  const contentType =
    document.mimeType ?? UPLOAD_RULES.file.types[storedExtension] ?? "application/octet-stream";

  return new NextResponse(file as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.byteLength),
      "Content-Disposition": contentDisposition(download ? "attachment" : "inline", fileName),
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** En-tete Content-Disposition compatible avec les noms de fichier accentues. */
function contentDisposition(type: "inline" | "attachment", fileName: string) {
  const asciiName = fileName.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "document";
  return `${type}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
