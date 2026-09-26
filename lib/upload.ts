/**
 * Envoi de fichiers depuis le navigateur, avec suivi de la progression
 * (fetch ne permet pas de connaitre l'avancement d'un envoi, d'ou XMLHttpRequest).
 */

type UploadKind = "image" | "pdf";
type SignResponse =
  | { mode: "server"; endpoint: string }
  | { mode: "direct"; uploadUrl: string; publicUrl: string; contentType: string }
  | { mode: "blob"; pathname: string; handleUploadUrl: string; contentType: string; canFallback: boolean };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(data?.error ?? `Echec de l'envoi (erreur ${res.status}).`);
  return data as T;
}

function sendWithProgress(
  method: "POST" | "PUT",
  url: string,
  body: XMLHttpRequestBodyInit,
  onProgress: (percent: number) => void,
  headers: Record<string, string> = {},
): Promise<XMLHttpRequest> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve(xhr);
    xhr.onerror = () => reject(new Error("Connexion impossible pendant l'envoi du fichier."));
    xhr.open(method, url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.send(body);
  });
}


/**
 * Erreur Vercel Blob justifiant de basculer sur le stockage de secours (store
 * plein, suspendu, indisponible...). Un fichier trop gros ou d'un type refuse
 * est une vraie erreur : on ne bascule pas. (Meme regle que lib/storage.ts.)
 */
function isBlobCapacityError(message: string) {
  return !/content type mismatch|file is too large/i.test(message);
}

/**
 * Envoie une image ou un PDF et renvoie son URL publique.
 * - Vercel Blob (principal, production) : envoi direct via le SDK Vercel Blob ;
 *   si le store refuse (plein, suspendu...), nouvel essai sur le stockage S3 ;
 * - stockage S3 (secours, Supabase) : envoi direct via une URL pre-signee ;
 * - stockage local (developpement) : envoi a la route serveur.
 * Le contenu reel du fichier est ensuite verifie par le serveur.
 */
export async function uploadMedia(
  kind: UploadKind,
  file: File,
  onProgress: (percent: number) => void,
  fallback = false,
): Promise<{ url: string; fileName: string }> {
  const sign = await postJson<SignResponse>("/api/upload/sign", {
    kind,
    fileName: file.name,
    contentType: file.type || (kind === "pdf" ? "application/pdf" : ""),
    size: file.size,
    fallback,
  });

  if (sign.mode === "server") {
    const formData = new FormData();
    formData.append("file", file);
    const xhr = await sendWithProgress("POST", sign.endpoint, formData, onProgress);
    let data: { url?: string; error?: string } | null = null;
    try {
      data = JSON.parse(xhr.responseText);
    } catch {
      // reponse non JSON (erreur serveur)
    }
    if (xhr.status < 200 || xhr.status >= 300 || !data?.url) {
      throw new Error(data?.error ?? `Echec de l'envoi (erreur ${xhr.status}).`);
    }
    return { url: data.url, fileName: file.name };
  }

  if (sign.mode === "blob") {
    // Vercel Blob : envoi direct via le SDK (jeton delivre par /api/upload/blob)
    const { upload } = await import("@vercel/blob/client");
    let blobUrl: string;
    try {
      const blob = await upload(sign.pathname, file, {
        access: "public",
        handleUploadUrl: sign.handleUploadUrl,
        clientPayload: kind,
        contentType: sign.contentType,
        onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
      });
      blobUrl = blob.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Echec de l'envoi vers le stockage.";
      if (sign.canFallback && isBlobCapacityError(message)) {
        console.warn(`Vercel Blob a refuse l'envoi (${message}) : bascule sur le stockage de secours.`);
        onProgress(0);
        return uploadMedia(kind, file, onProgress, true);
      }
      throw new Error(message);
    }
    const confirmed = await postJson<{ url: string }>("/api/upload/confirm", { kind, url: blobUrl });
    return { url: confirmed.url, fileName: file.name };
  }

  const xhr = await sendWithProgress("PUT", sign.uploadUrl, file, onProgress, { "Content-Type": sign.contentType });
  if (xhr.status < 200 || xhr.status >= 300) {
    throw new Error(`Le stockage a refuse le fichier (erreur ${xhr.status}).`);
  }

  const confirmed = await postJson<{ url: string }>("/api/upload/confirm", { kind, url: sign.publicUrl });
  return { url: confirmed.url, fileName: file.name };
}
