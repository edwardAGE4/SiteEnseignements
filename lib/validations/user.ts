import { z } from "zod";

/**
 * Mot de passe d'un compte d'administration : 12 caracteres minimum (comme
 * prisma/admin.ts) et 72 octets maximum (limite de bcrypt, au-dela les
 * caracteres seraient ignores sans que l'utilisateur le sache).
 */
const password = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Le mot de passe est trop long (72 caractères maximum).");

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(100),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(254),
  password,
  role: z.enum(["ADMIN", "EDITOR"]),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: z.enum(["ADMIN", "EDITOR"]),
  isActive: z.boolean(),
  password: password.optional().or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
