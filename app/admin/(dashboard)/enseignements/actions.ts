"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-role";
import { teachingSchema } from "@/lib/validations/teaching";
import { deleteFile } from "@/lib/storage";

export type TeachingFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parseTeachingForm(formData: FormData) {
  const tagsRaw = (formData.get("tags") as string) ?? "";
  const categoryIds = formData.getAll("categoryIds").map(String);

  return teachingSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    spotifyUrl: formData.get("spotifyUrl") || undefined,
    pdfUrl: formData.get("pdfUrl") || undefined,
    pdfFileName: formData.get("pdfFileName") || undefined,
    coverImageUrl: formData.get("coverImageUrl") || undefined,
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: formData.get("status"),
    categoryIds,
  });
}

export async function createTeaching(
  _prevState: TeachingFormState,
  formData: FormData,
): Promise<TeachingFormState> {
  const session = await requireSession();
  const parsed = parseTeachingForm(formData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  const { categoryIds, ...data } = parsed.data;

  const existing = await prisma.teaching.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { error: "Ce slug est deja utilise par un autre enseignement.", fieldErrors: { slug: "Slug deja utilise." } };
  }

  const teaching = await prisma.teaching.create({
    data: {
      ...data,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      createdById: session.user.id,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  revalidatePath("/admin/enseignements");
  revalidatePath("/enseignements");
  revalidatePath("/");
  redirect(`/admin/enseignements/${teaching.id}/modifier`);
}

export async function updateTeaching(
  id: string,
  _prevState: TeachingFormState,
  formData: FormData,
): Promise<TeachingFormState> {
  await requireSession();
  const parsed = parseTeachingForm(formData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  const { categoryIds, ...data } = parsed.data;

  const existing = await prisma.teaching.findUnique({ where: { slug: data.slug } });
  if (existing && existing.id !== id) {
    return { error: "Ce slug est deja utilise par un autre enseignement.", fieldErrors: { slug: "Slug deja utilise." } };
  }

  const current = await prisma.teaching.findUnique({ where: { id } });
  if (!current) {
    return { error: "Enseignement introuvable." };
  }

  await prisma.teachingCategory.deleteMany({ where: { teachingId: id } });
  await prisma.teaching.update({
    where: { id },
    data: {
      ...data,
      publishedAt:
        data.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  revalidatePath("/admin/enseignements");
  revalidatePath("/enseignements");
  revalidatePath(`/enseignements/${data.slug}`);
  revalidatePath("/");

  return { error: undefined };
}

export async function deleteTeaching(id: string) {
  await requireSession();
  const teaching = await prisma.teaching.findUnique({ where: { id } });
  if (!teaching) return;

  await prisma.teaching.delete({ where: { id } });

  if (teaching.pdfUrl) await deleteFile(teaching.pdfUrl).catch(() => {});
  if (teaching.coverImageUrl) await deleteFile(teaching.coverImageUrl).catch(() => {});

  revalidatePath("/admin/enseignements");
  revalidatePath("/enseignements");
  revalidatePath("/");
}

export async function toggleTeachingStatus(id: string) {
  await requireSession();
  const teaching = await prisma.teaching.findUnique({ where: { id } });
  if (!teaching) return;

  const nextStatus = teaching.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  await prisma.teaching.update({
    where: { id },
    data: {
      status: nextStatus,
      publishedAt: nextStatus === "PUBLISHED" ? (teaching.publishedAt ?? new Date()) : teaching.publishedAt,
    },
  });

  revalidatePath("/admin/enseignements");
  revalidatePath("/enseignements");
  revalidatePath(`/enseignements/${teaching.slug}`);
  revalidatePath("/");
}
