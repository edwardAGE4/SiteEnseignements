import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Le slug doit contenir au moins 2 caractères.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets."),
  description: z.string().trim().max(500).optional(),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine((value) => !value || value.startsWith("/uploads/images/") || /^https:\/\//.test(value), "Image invalide."),
  isActive: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
