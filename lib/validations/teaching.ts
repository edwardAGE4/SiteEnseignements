import { z } from "zod";
import { parseDuration, parseSpotifyUrl, parseVideoUrl } from "@/lib/media";

/* Validation d'une ressource (audio, video, livre, fichier pratique). */

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .optional()
    .transform((value) => value || undefined);

/** Lien externe : http(s) uniquement (jamais javascript:, data:...). */
const externalUrl = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    }, `${label} : lien invalide (il doit commencer par https://).`);

/** Fichier envoye sur le stockage du site (ou URL https). */
const storedFileUrl = (folder: "images" | "documents" | "audios", label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) => !value || value.startsWith(`/uploads/${folder}/`) || /^https:\/\//.test(value),
      `${label} : adresse de fichier invalide.`,
    );

export const MAX_DOCUMENTS = 20;

export const BOOK_FORMATS = ["Broché", "Relié", "PDF", "EPUB", "Livre audio", "Lecture en ligne"] as const;

/** Fichier joint deja envoye (id absent = nouveau fichier). */
const documentSchema = z.object({
  id: z.string().optional(),
  url: z
    .string()
    .refine((value) => value.startsWith("/uploads/documents/") || /^https:\/\//.test(value), "Adresse de fichier invalide."),
  fileName: z.string().trim().min(1, "Nom de fichier manquant.").max(255),
  mimeType: z.string().max(150).nullish(),
  sizeBytes: z.number().int().nonnegative().nullish(),
});

export type TeachingDocumentInput = z.infer<typeof documentSchema>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISBN = /^(?:\d[- ]?){9}[\dXx]$|^(?:\d[- ]?){12}\d$/;

export const teachingSchema = z
  .object({
    type: z.enum(["AUDIO", "VIDEO", "BOOK", "FILE"], { message: "Choisissez le type de ressource." }),
    title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(200, "Titre : 200 caractères maximum."),
    slug: z
      .string()
      .trim()
      .min(3, "Le slug doit contenir au moins 3 caractères.")
      .max(120, "Slug : 120 caractères maximum.")
      .regex(SLUG, "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets."),
    excerpt: optionalText(320, "Description courte"),
    description: z
      .string()
      .trim()
      .min(10, "La description doit contenir au moins 10 caractères.")
      .max(20000, "Description : 20 000 caractères maximum.")
      .transform((value) => value.replace(/\r\n/g, "\n")),
    videoUrl: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .refine(
        (value) => !value || parseVideoUrl(value) !== null,
        "Lien vidéo non reconnu. Utilisez un lien YouTube ou Vimeo (ex : https://www.youtube.com/watch?v=...).",
      ),
    spotifyUrl: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .refine(
        (value) => !value || parseSpotifyUrl(value) !== null,
        "Lien Spotify non reconnu (ex : https://open.spotify.com/episode/...).",
      ),
    audioUrl: storedFileUrl("audios", "Fichier audio"),
    duration: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || parseDuration(value) !== null, "Durée invalide. Formats acceptés : 45 (minutes), 42:10 ou 1:02:05.")
      .transform((value) => (value ? parseDuration(value) : null)),
    series: optionalText(120, "Série"),
    subtitle: optionalText(200, "Sous-titre"),
    author: optionalText(200, "Auteur"),
    isbn: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .refine((value) => !value || ISBN.test(value), "ISBN invalide (10 ou 13 chiffres)."),
    bookFormats: z.array(z.enum(BOOK_FORMATS)).max(BOOK_FORMATS.length),
    readUrl: externalUrl("Lien de lecture"),
    purchaseUrl: externalUrl("Lien d'achat"),
    downloadPolicy: z.enum(["DOWNLOAD", "VIEW_ONLY"]),
    documents: z.array(documentSchema).max(MAX_DOCUMENTS, `${MAX_DOCUMENTS} fichiers maximum.`),
    coverImageUrl: storedFileUrl("images", "Image"),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(15, "15 mots-clés maximum."),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    featured: z.boolean(),
    publishedAt: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Date de publication invalide.")
      .transform((value) => (value ? new Date(value) : undefined)),
    seoTitle: optionalText(70, "Titre SEO"),
    seoDescription: optionalText(170, "Description SEO"),
    categoryIds: z.array(z.string().min(1)).max(20),
  })
  .superRefine((data, ctx) => {
    if (data.type === "AUDIO" && !data.audioUrl && !data.spotifyUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["audioUrl"],
        message: "Ajoutez un fichier audio ou un lien Spotify.",
      });
    }
    if (data.type === "VIDEO" && !data.videoUrl) {
      ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Renseignez le lien de la vidéo (YouTube ou Vimeo)." });
    }
    if (data.type === "FILE" && data.documents.length === 0) {
      ctx.addIssue({ code: "custom", path: ["documents"], message: "Ajoutez au moins un fichier." });
    }
  });

export type TeachingInput = z.infer<typeof teachingSchema>;

/** Points d'attention non bloquants a signaler apres l'enregistrement. */
export function getTeachingWarnings(data: {
  status: string;
  type?: string;
  coverImageUrl?: string | null;
  publishedAt?: Date | null;
}): string[] {
  const warnings: string[] = [];
  if (data.status === "DRAFT") {
    warnings.push("Cette ressource est en brouillon : elle n'est pas encore visible sur le site public.");
  }
  if (data.status === "ARCHIVED") {
    warnings.push("Cette ressource est archivée : elle n'est plus visible sur le site public.");
  }
  if (data.status === "PUBLISHED" && data.publishedAt && data.publishedAt.getTime() > Date.now()) {
    warnings.push("La date de publication est dans le futur : la ressource apparaîtra sur le site à cette date.");
  }
  if (!data.coverImageUrl && data.type !== "VIDEO") {
    warnings.push("Aucune image : un visuel par défaut sera affiché.");
  }
  return warnings;
}

function parseJsonArray(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return null; // rejete par la validation
  }
}

/**
 * Valeurs du formulaire de ressource -> objet a valider. Utilise par le
 * navigateur (controle immediat) et par le serveur (controle de reference).
 * Le bouton "Enregistrer comme brouillon" (intent=draft) force le statut.
 */
export function teachingInputFromFormData(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : undefined;
  };

  return {
    type: text("type"),
    title: text("title"),
    slug: text("slug"),
    excerpt: text("excerpt"),
    description: text("description"),
    videoUrl: text("videoUrl"),
    spotifyUrl: text("spotifyUrl"),
    audioUrl: text("audioUrl"),
    duration: text("duration"),
    series: text("series"),
    subtitle: text("subtitle"),
    author: text("author"),
    isbn: text("isbn"),
    bookFormats: formData.getAll("bookFormats").map(String),
    readUrl: text("readUrl"),
    purchaseUrl: text("purchaseUrl"),
    downloadPolicy: text("downloadPolicy") ?? "DOWNLOAD",
    documents: parseJsonArray(formData.get("documents")),
    coverImageUrl: text("coverImageUrl"),
    tags: (text("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: text("intent") === "draft" ? "DRAFT" : text("status"),
    featured: formData.get("featured") === "on",
    publishedAt: text("publishedAt"),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    categoryIds: formData.getAll("categoryIds").map(String),
  };
}

/** Premier message d'erreur par champ. */
export function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}
