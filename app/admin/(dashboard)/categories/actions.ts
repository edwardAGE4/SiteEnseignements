"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-role";
import { categorySchema } from "@/lib/validations/category";

export type CategoryFormState =
  | { error?: string; success?: string; warnings?: string[]; fieldErrors?: Record<string, string> }
  | undefined;

function categoryWarnings(description?: string) {
  return description ? [] : ["Aucune description : la page de la catégorie sera moins explicite pour les visiteurs."];
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireSession();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug: parsed.data.slug }, { name: parsed.data.name }] },
  });
  if (existing) {
    return { error: "Une catégorie avec ce nom ou ce slug existe déjà." };
  }

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });

  await prisma.category.create({
    data: { ...parsed.data, order: (maxOrder._max.order ?? 0) + 1 },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
  return {
    success: `La catégorie "${parsed.data.name}" a été créée avec succès.`,
    warnings: categoryWarnings(parsed.data.description),
  };
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireSession();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug: parsed.data.slug }, { name: parsed.data.name }], NOT: { id } },
  });
  if (existing) {
    return { error: "Une catégorie avec ce nom ou ce slug existe déjà." };
  }

  await prisma.category.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
  return {
    success: `La catégorie "${parsed.data.name}" a été mise à jour.`,
    warnings: categoryWarnings(parsed.data.description),
  };
}

export async function deleteCategory(id: string) {
  await requireSession();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function reorderCategories(orderedIds: string[]) {
  await requireSession();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.category.update({ where: { id }, data: { order: index + 1 } })),
  );
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}
