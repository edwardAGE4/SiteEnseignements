"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-role";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";

export type UserFormState =
  | { error?: string; success?: string; warnings?: string[]; fieldErrors?: Record<string, string> }
  | undefined;

export async function createUser(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Un utilisateur avec cet e-mail existe deja." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/admin/utilisateurs");
  return {
    success: `L'utilisateur ${parsed.data.name} a ete cree avec succes.`,
    warnings:
      parsed.data.role === "ADMIN"
        ? ["Ce compte est administrateur : il peut gerer les utilisateurs et tous les contenus."]
        : [],
  };
}

export async function updateUser(
  id: string,
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  if (id === session.user.id && (parsed.data.role !== "ADMIN" || !parsed.data.isActive)) {
    return { error: "Vous ne pouvez pas retirer vos propres droits d'administrateur." };
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      ...(parsed.data.password ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) } : {}),
    },
  });

  revalidatePath("/admin/utilisateurs");

  const warnings: string[] = [];
  if (!parsed.data.isActive) warnings.push("Ce compte est desactive : l'utilisateur ne pourra plus se connecter.");
  if (parsed.data.password) warnings.push("Le mot de passe a ete modifie : pensez a communiquer le nouveau a l'utilisateur.");

  return { success: `L'utilisateur ${parsed.data.name} a ete mis a jour.`, warnings };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (id === session.user.id) return;
  await prisma.user.delete({ where: { id } }).catch(() => {
    // un utilisateur ayant deja cree des enseignements ne peut pas etre supprime
  });
  revalidatePath("/admin/utilisateurs");
}
