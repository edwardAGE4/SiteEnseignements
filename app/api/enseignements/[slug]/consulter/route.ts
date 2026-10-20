import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { backendForUrl, getRemoteFileUrl, readLocalFile } from "@/lib/storage";
import { fileExtension } from "@/lib/file-validation";

/**
 * Fournit un PDF (?doc=<id>) au lecteur integre du site (PdfViewer), sans
 * jamais exposer l'adresse reelle du fichier : le contenu transite par ici,
 * par morceaux (requetes Range de pdf.js), ce qui reste sous la limite de
 * 4,5 Mo par reponse des fonctions Vercel.
 * Refuse l'ouverture directe dans un onglet (en-tete Sec-Fetch-Dest) : ce
 * n'est pas une protection absolue, seulement un frein au telechargement.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  // Navigation directe (barre d'adresse, lien, iframe) : refusee. Seul fetch() est accepte.
  const dest = request.headers.get("sec-fetch-dest");
  if (dest && dest !== "empty") {
    return NextResponse.json({ error: "Ce document se consulte depuis la page de la ressource." }, { status: 403 });
  }

  const { slug } = await context.params;
  const documentId = request.nextUrl.searchParams.get("doc");
  if (!documentId) return notFound();

  const resource = await prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    select: {
      documents: { where: { id: documentId }, take: 1, select: { url: true, fileName: true, mimeType: true } },
    },
  });
  const document = resource?.documents[0];
  if (!document || !isPdf(document)) return notFound();

  const range = request.headers.get("range");
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  });

  if (backendForUrl(document.url) === "local") {
    const file = await readLocalFile(document.url);
    if (!file) return notFound();
    const slice = parseRange(range, file.byteLength);
    if (slice === "invalid") return rangeNotSatisfiable(file.byteLength);
    if (slice) {
      headers.set("Content-Range", `bytes ${slice.start}-${slice.end}/${file.byteLength}`);
      headers.set("Content-Length", String(slice.end - slice.start + 1));
      return new NextResponse(file.slice(slice.start, slice.end + 1) as BodyInit, { status: 206, headers });
    }
    headers.set("Content-Length", String(file.byteLength));
    return new NextResponse(file as BodyInit, { headers });
  }

  // Fichier distant (Blob / S3) : relaye en flux, avec la meme plage d'octets
  const upstream = await fetch(await getRemoteFileUrl(document.url, document.fileName, false), {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return upstream.status === 416 ? rangeNotSatisfiable(null) : notFound();
  }
  for (const name of ["Content-Length", "Content-Range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

function isPdf(document: { fileName: string; mimeType: string | null; url: string }) {
  return (
    document.mimeType === "application/pdf" ||
    fileExtension(document.fileName) === "pdf" ||
    fileExtension(document.url) === "pdf"
  );
}

/** Plage « bytes=debut-fin » (une seule) ; null si absente, "invalid" si hors du fichier. */
function parseRange(header: string | null, size: number): { start: number; end: number } | null | "invalid" {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const [, from, to] = match;
  let start: number;
  let end: number;
  if (from === "") {
    // « bytes=-500 » : les 500 derniers octets
    start = Math.max(0, size - Number(to));
    end = size - 1;
  } else {
    start = Number(from);
    end = to === "" ? size - 1 : Math.min(Number(to), size - 1);
  }
  return start <= end && start < size ? { start, end } : "invalid";
}

function notFound() {
  return NextResponse.json({ error: "Ce document n'est pas disponible." }, { status: 404 });
}

function rangeNotSatisfiable(size: number | null) {
  return new NextResponse(null, { status: 416, headers: size === null ? {} : { "Content-Range": `bytes */${size}` } });
}
