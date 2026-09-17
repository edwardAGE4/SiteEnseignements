import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().url("URL invalide.").optional());

export const teachingSchema = z
  .object({
    title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caracteres.").max(200),
    slug: z
      .string()
      .trim()
      .min(3, "Le slug doit contenir au moins 3 caracteres.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets."),
    description: z.string().trim().min(10, "La description doit contenir au moins 10 caracteres.").max(2000),
    youtubeUrl: urlOrEmpty,
    spotifyUrl: urlOrEmpty,
    pdfUrl: z.string().optional(),
    pdfFileName: z.string().optional(),
    coverImageUrl: z.string().optional(),
    tags: z.array(z.string().trim().toLowerCase().min(1)).max(10),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    categoryIds: z.array(z.string()).min(1, "Selectionnez au moins une categorie."),
  })
  .refine(
    (data) => Boolean(data.youtubeUrl || data.spotifyUrl || data.pdfUrl),
    { message: "Ajoutez au moins un format : YouTube, Spotify ou PDF.", path: ["youtubeUrl"] },
  );

export type TeachingInput = z.infer<typeof teachingSchema>;
