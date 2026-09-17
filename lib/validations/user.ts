import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caracteres.").max(100),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
  role: z.enum(["ADMIN", "EDITOR"]),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: z.enum(["ADMIN", "EDITOR"]),
  isActive: z.boolean(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
