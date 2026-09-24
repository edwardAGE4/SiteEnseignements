import { z } from "zod";
import { extractYoutubeId } from "@/lib/media";

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().url("URL invalide.").optional());

export const MAX_DOCUMENTS = 20;

/** Document PDF deja envoye via /api/upload/pdf (id absent = nouveau document). */
const documentSchema = z.object({
  id: z.string().optional(),
  url: z
    .string()
    .refine((value) => value.startsWith("/uploads/documents/") || /^https?:\/\//.test(value), "URL de document invalide."),
  fileName: z.string().trim().min(1, "Nom de fichier manquant.").max(255),
});

export type TeachingDocumentInput = z.infer<typeof documentSchema>;

export const teachingSchema = z
  .object({
    title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caracteres.").max(200),
    slug: z
      .string()
      .trim()
      .min(3, "Le slug doit contenir au moins 3 caracteres.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets."),
    description: z.string().trim().min(10, "La description doit contenir au moins 10 caracteres.").max(2000),
    youtubeUrl: urlOrEmpty.refine(
      (value) => !value || extractYoutubeId(value) !== null,
      "Lien YouTube non reconnu. Utilisez le lien de la video (ex : https://www.youtube.com/watch?v=...).",
    ),
    spotifyUrl: urlOrEmpty,
    documents: z.array(documentSchema).max(MAX_DOCUMENTS, `${MAX_DOCUMENTS} documents PDF maximum.`),
    coverImageUrl: z.string().optional(),
    tags: z.array(z.string().trim().toLowerCase().min(1)).max(10),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    categoryIds: z.array(z.string()).min(1, "Selectionnez au moins une categorie."),
  })
  .refine(
    (data) => Boolean(data.youtubeUrl || data.spotifyUrl || data.documents.length),
    { message: "Ajoutez au moins un format : YouTube, Spotify ou PDF.", path: ["youtubeUrl"] },
  );

export type TeachingInput = z.infer<typeof teachingSchema>;

/** Points d'attention non bloquants a signaler apres l'enregistrement. */
export function getTeachingWarnings(data: { status: string; coverImageUrl?: string | null }): string[] {
  const warnings: string[] = [];
  if (data.status === "DRAFT") {
    warnings.push("Cet enseignement est en brouillon : il n'est pas encore visible sur le site public.");
  }
  if (!data.coverImageUrl) {
    warnings.push("Aucune image de couverture : une image par defaut sera affichee.");
  }
  return warnings;
}
