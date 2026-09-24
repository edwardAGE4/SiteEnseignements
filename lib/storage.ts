import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir, unlink, readFile } from "node:fs/promises";
import path from "node:path";

const PROVIDER = process.env.STORAGE_PROVIDER ?? "local";

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

function buildKey(prefix: string, originalName: string) {
  const ext = path.extname(originalName).toLowerCase();
  return `${prefix}/${randomUUID()}${ext}`;
}

/**
 * Enregistre un fichier et renvoie son URL publique.
 * En production, configurez STORAGE_PROVIDER=s3 (compatible AWS S3 / Supabase Storage)
 * via les variables d'environnement S3_*. En developpement sans identifiants,
 * les fichiers sont ecrits localement dans /public/uploads pour rester fonctionnel.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  prefix: "images" | "documents",
): Promise<string> {
  const key = buildKey(prefix, originalName);

  if (PROVIDER === "s3") {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) {
      return `${endpoint.replace(/\/$/, "")}/${process.env.S3_BUCKET}/${key}`;
    }
    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", prefix);
  await mkdir(uploadsDir, { recursive: true });
  const fileName = path.basename(key);
  await writeFile(path.join(uploadsDir, fileName), buffer);
  return `/uploads/${prefix}/${fileName}`;
}

/**
 * Relit un fichier enregistre (par son URL renvoyee par uploadFile) pour le
 * servir depuis le meme domaine que le site. Renvoie null s'il est introuvable.
 */
export async function readStoredFile(url: string): Promise<Uint8Array | null> {
  if (PROVIDER === "s3") {
    const bucket = process.env.S3_BUCKET;
    const key = bucket ? url.split(`${bucket}/`)[1] : undefined;
    if (!bucket || !key) return null;
    const client = getS3Client();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key })).catch(() => null);
    return (await result?.Body?.transformToByteArray()) ?? null;
  }

  if (!url.startsWith("/uploads/")) return null;
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(process.cwd(), "public", url);
  // empeche de sortir du dossier uploads (ex. /uploads/../../.env)
  if (!filePath.startsWith(uploadsRoot + path.sep)) return null;
  return readFile(filePath).catch(() => null);
}

export async function deleteFile(url: string): Promise<void> {
  if (PROVIDER === "s3") {
    const bucket = process.env.S3_BUCKET;
    if (!bucket || !url.includes(bucket)) return;
    const key = url.split(`${bucket}/`)[1];
    if (!key) return;
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }

  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath).catch(() => {});
  }
}
