import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { del, getDownloadUrl, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir, unlink, readFile, open } from "node:fs/promises";
import path from "node:path";

/**
 * Stockage des fichiers (images et PDF).
 *
 * En production, deux stockages cohabitent :
 * 1. Vercel Blob (principal) : store public connecte au projet Vercel.
 * 2. Supabase Storage via S3 (secours) : utilise seulement si Vercel Blob
 *    refuse l'envoi (store plein / suspendu / indisponible).
 * En developpement sans configuration : dossier /public/uploads.
 *
 * STORAGE_PROVIDER (optionnel) : "local" ou "s3" pour forcer un stockage unique ;
 * vide ou "blob" = Vercel Blob en principal, S3 en secours s'il est configure.
 *
 * Chaque fichier est ensuite lu / supprime selon SON URL (Blob, S3 ou local),
 * les deux stockages pouvant contenir des fichiers.
 */
export type UploadKind = "images" | "documents";
export type StorageBackend = "blob" | "s3" | "local";

/**
 * Jeton d'acces du store Vercel Blob. Vercel l'injecte en connectant le store
 * au projet : BLOB_READ_WRITE_TOKEN par defaut, ou <PREFIXE>_READ_WRITE_TOKEN
 * si un prefixe a ete choisi (ex. JMGFILE_READ_WRITE_TOKEN).
 */
export function getBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const entry = Object.entries(process.env).find(
    ([name, value]) => name.endsWith("_READ_WRITE_TOKEN") && value?.startsWith("vercel_blob_rw_"),
  );
  return entry?.[1];
}

function isS3Configured() {
  if (!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)) return false;
  // S3_ENDPOINT laisse a sa valeur d'exemple (https://<ref>...) : S3 inutilisable
  const endpoint = process.env.S3_ENDPOINT;
  if (endpoint && !URL.canParse(endpoint)) {
    console.error(`[storage] S3_ENDPOINT invalide ("${endpoint}") : stockage S3 ignore.`);
    return false;
  }
  return true;
}

/** Stockages utilisables pour les nouveaux envois, par ordre de preference. */
export function getUploadBackends(): StorageBackend[] {
  const forced = process.env.STORAGE_PROVIDER;
  if (forced === "local") return ["local"];
  if (forced === "s3") return isS3Configured() ? ["s3"] : [];

  const backends: StorageBackend[] = [];
  if (getBlobToken()) backends.push("blob");
  if (isS3Configured()) backends.push("s3");
  if (backends.length === 0 && !process.env.VERCEL) backends.push("local"); // developpement
  return backends;
}

/** Stockage d'un fichier deja enregistre, deduit de son URL. */
export function backendForUrl(url: string): StorageBackend | null {
  if (url.startsWith("/uploads/")) return "local";
  if (isBlobUrl(url)) return "blob";
  if (keyFromUrl(url)) return "s3";
  return null;
}

/* ------------------------------------------------------------------ */
/* Vercel Blob                                                         */
/* ------------------------------------------------------------------ */

function requireBlobToken() {
  const token = getBlobToken();
  if (!token) throw new Error("Jeton Vercel Blob introuvable (BLOB_READ_WRITE_TOKEN).");
  return token;
}

/** URL d'un fichier Vercel Blob (et non d'un autre site). */
function isBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function safeFileBase(originalName: string) {
  return (
    path
      .basename(originalName, path.extname(originalName))
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-.]+/, "")
      .replace(/[-.]+$/, "")
      .slice(0, 80) || "fichier"
  );
}

/**
 * Chemin d'un fichier dans le store Blob : <dossier>/<uuid>/<nom-du-fichier>.
 * Le nom d'origine (nettoye) est conserve pour que le telechargement propose
 * un nom lisible.
 */
export function buildBlobPathname(prefix: UploadKind, originalName: string) {
  return `${prefix}/${randomUUID()}/${safeFileBase(originalName)}${path.extname(originalName).toLowerCase()}`;
}

/** Chemins acceptes pour un envoi direct vers le store Blob. */
export const BLOB_PATHNAME_PATTERN = /^(images|documents)\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/;

/**
 * Erreur Vercel Blob qui justifie de basculer sur le stockage de secours
 * (store plein, suspendu, indisponible...). Un fichier trop gros ou d'un type
 * refuse n'est PAS une raison de basculer.
 */
export function isBlobCapacityError(message: string) {
  return !/content type mismatch|file is too large/i.test(message);
}

/* ------------------------------------------------------------------ */
/* S3 (Supabase Storage)                                               */
/* ------------------------------------------------------------------ */

function getS3Client() {
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

function getBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET n'est pas défini.");
  return bucket;
}

/** Endpoint S3 de Supabase ? (https://<ref>.supabase.co/storage/v1/s3) */
function supabaseStorageBase(): string | null {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "") ?? "";
  return endpoint.endsWith("/storage/v1/s3") ? endpoint.slice(0, -"/s3".length) : null;
}

/** URL publique (lecture sans authentification) d'un objet du bucket. */
function publicUrlForKey(key: string) {
  const bucket = getBucket();
  const explicit = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (explicit) return `${explicit}/${key}`;

  const supabase = supabaseStorageBase();
  if (supabase) return `${supabase}/object/public/${bucket}/${key}`;

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  if (endpoint) return `${endpoint}/${bucket}/${key}`;
  return `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

/** Retrouve la cle S3 a partir de l'URL publique enregistree en base. */
function keyFromUrl(url: string): string | null {
  if (!/^https?:\/\//.test(url) || isBlobUrl(url)) return null;
  const explicit = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (explicit && url.startsWith(`${explicit}/`)) return url.slice(explicit.length + 1);
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;
  // ".../<bucket>/<cle>" ou "https://<bucket>.s3.<region>.amazonaws.com/<cle>"
  const marker = url.includes(`/${bucket}/`) ? `/${bucket}/` : ".amazonaws.com/";
  const key = url.split(marker)[1];
  return key && /^(images|documents)\//.test(key) ? decodeURIComponent(key.split("?")[0]) : null;
}

export function buildKey(prefix: UploadKind, originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  return `${prefix}/${randomUUID()}${ext}`;
}

/**
 * Prepare un envoi direct navigateur -> S3 via une URL pre-signee
 * (PUT, valable 10 minutes, Content-Type impose).
 */
export async function createDirectUpload(prefix: UploadKind, originalName: string, contentType: string) {
  const key = buildKey(prefix, originalName);
  const uploadUrl = await getSignedUrl(
    getS3Client(),
    new PutObjectCommand({ Bucket: getBucket(), Key: key, ContentType: contentType }),
    // content-type inclus dans la signature : le navigateur doit envoyer exactement ce type
    { expiresIn: 600, signableHeaders: new Set(["content-type"]) },
  );
  return { uploadUrl, publicUrl: publicUrlForKey(key) };
}

/* ------------------------------------------------------------------ */
/* Local (developpement)                                               */
/* ------------------------------------------------------------------ */

/** Chemin disque d'un fichier local, en refusant toute sortie du dossier uploads. */
function localPath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(process.cwd(), "public", url);
  return filePath.startsWith(uploadsRoot + path.sep) ? filePath : null;
}

/** Relit un fichier stocke localement (null s'il est introuvable). */
export async function readLocalFile(url: string): Promise<Uint8Array | null> {
  const filePath = localPath(url);
  return filePath ? readFile(filePath).catch(() => null) : null;
}

/* ------------------------------------------------------------------ */
/* Operations communes                                                 */
/* ------------------------------------------------------------------ */

async function uploadTo(
  backend: StorageBackend,
  buffer: Buffer,
  originalName: string,
  contentType: string,
  prefix: UploadKind,
): Promise<string> {
  if (backend === "blob") {
    const blob = await put(buildBlobPathname(prefix, originalName), buffer, {
      access: "public",
      contentType,
      token: requireBlobToken(),
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (backend === "s3") {
    const key = buildKey(prefix, originalName);
    await getS3Client().send(
      new PutObjectCommand({ Bucket: getBucket(), Key: key, Body: buffer, ContentType: contentType }),
    );
    return publicUrlForKey(key);
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", prefix);
  await mkdir(uploadsDir, { recursive: true });
  const fileName = path.basename(buildKey(prefix, originalName));
  await writeFile(path.join(uploadsDir, fileName), buffer);
  return `/uploads/${prefix}/${fileName}`;
}

/**
 * Enregistre un fichier recu par le serveur et renvoie son URL publique :
 * Vercel Blob d'abord, S3 si Blob refuse (store plein...).
 * (En production, preferer l'envoi direct depuis le navigateur : le corps des
 * requetes vers les fonctions Vercel est limite a 4,5 Mo.)
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  prefix: UploadKind,
): Promise<string> {
  const backends = getUploadBackends();
  if (backends.length === 0) throw new Error("Aucun stockage de fichiers configuré.");

  let lastError: unknown;
  for (const backend of backends) {
    try {
      return await uploadTo(backend, buffer, originalName, contentType, prefix);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      if (backend !== "blob" || !isBlobCapacityError(message)) throw error;
      console.warn(`[storage] Vercel Blob indisponible (${message}), bascule sur le stockage de secours.`);
    }
  }
  throw lastError;
}

/** Lit les premiers octets d'un fichier (verification du type reel). */
export async function readStoredFileHead(url: string, length = 16): Promise<Buffer | null> {
  const backend = backendForUrl(url);

  if (backend === "blob") {
    // store public : lecture directe, seulement les premiers octets
    const res = await fetch(url, { headers: { Range: `bytes=0-${length - 1}` }, cache: "no-store" }).catch(() => null);
    if (!res?.ok) return null;
    return Buffer.from(await res.arrayBuffer()).subarray(0, length);
  }

  if (backend === "s3") {
    const result = await getS3Client()
      .send(new GetObjectCommand({ Bucket: getBucket(), Key: keyFromUrl(url)!, Range: `bytes=0-${length - 1}` }))
      .catch(() => null);
    const bytes = await result?.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  }

  const filePath = backend === "local" ? localPath(url) : null;
  if (!filePath) return null;
  const handle = await open(filePath, "r").catch(() => null);
  if (!handle) return null;
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * URL a laquelle rediriger le visiteur pour lire / telecharger un fichier
 * distant (Blob ou S3). Les fichiers ne transitent pas par le serveur
 * (reponses limitees a 4,5 Mo sur Vercel).
 */
export async function getRemoteFileUrl(url: string, fileName: string, download: boolean): Promise<string> {
  if (isBlobUrl(url)) {
    // ?download=1 force le telechargement ; le nom propose est celui du fichier
    // dans le store (nom d'origine nettoye, cf. buildBlobPathname)
    return download ? getDownloadUrl(url) : url;
  }

  if (supabaseStorageBase() && !process.env.S3_PUBLIC_URL) {
    // Supabase : ?download=<nom> force le telechargement avec ce nom de fichier
    return download ? `${url}?download=${encodeURIComponent(fileName)}` : url;
  }

  const key = keyFromUrl(url);
  if (!key) return url;
  const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: getBucket(), Key: key, ResponseContentDisposition: disposition }),
    { expiresIn: 300 },
  );
}

export async function deleteFile(url: string): Promise<void> {
  const backend = backendForUrl(url);

  if (backend === "blob") {
    await del(url, { token: requireBlobToken() });
  } else if (backend === "s3") {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: keyFromUrl(url)! }));
  } else if (backend === "local") {
    const filePath = localPath(url);
    if (filePath) await unlink(filePath).catch(() => {});
  }
}
