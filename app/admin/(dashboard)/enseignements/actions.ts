"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-role";
import { getTeachingWarnings, teachingSchema, type TeachingDocumentInput } from "@/lib/validations/teaching";
import { deleteFile } from "@/lib/storage";

export type TeachingFormState =
  | {
      error?: string;
      success?: string;
      warnings?: string[];
      fieldErrors?: Record<string, string>;
      /** Documents tels qu'enregistres, pour resynchroniser le formulaire. */
      documents?: { id: string; url: string; fileName: string }[];
    }
  | undefined;

function parseDocuments(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || !raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return null; // rejete par la validation
  }
}

function parseTeachingForm(formData: FormData) {
  const tagsRaw = (formData.get("tags") as string) ?? "";
  const categoryIds = formData.getAll("categoryIds").map(String);

  return teachingSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    spotifyUrl: formData.get("spotifyUrl") || undefined,
    documents: parseDocuments(formData.get("documents")),
    coverImageUrl: formData.get("coverImageUrl") || undefined,
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: formData.get("status"),
    categoryIds,
  });
}

function toDocumentRows(documents: TeachingDocumentInput[]) {
  return documents.map((document, index) => ({ url: document.url, fileName: document.fileName, order: index }));
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

  const { categoryIds, documents, ...data } = parsed.data;

  const existing = await prisma.teaching.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return { error: "Ce slug est déjà utilisé par un autre enseignement.", fieldErrors: { slug: "Slug déjà utilisé." } };
  }

  const teaching = await prisma.teaching.create({
    data: {
      ...data,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      createdById: session.user.id,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      documents: { create: toDocumentRows(documents) },
    },
  });

  revalidatePath("/admin/enseignements");
  revalidatePath("/enseignements");
  revalidatePath("/");
  redirect(`/admin/enseignements/${teaching.id}/modifier?statut=cree`);
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

  const { categoryIds, documents, ...data } = parsed.data;

  const existing = await prisma.teaching.findUnique({ where: { slug: data.slug } });
  if (existing && existing.id !== id) {
    return { error: "Ce slug est déjà utilisé par un autre enseignement.", fieldErrors: { slug: "Slug déjà utilisé." } };
  }

  const current = await prisma.teaching.findUnique({ where: { id }, include: { documents: true } });
  if (!current) {
    return { error: "Enseignement introuvable." };
  }

  // Documents : on conserve ceux encore presents (reconnus par id ou par URL de
  // fichier), on cree les nouveaux, on supprime les autres avec leur fichier et
  // leurs "j'aime".
  const findExisting = (document: TeachingDocumentInput) =>
    current.documents.find((existingDoc) => existingDoc.id === document.id || existingDoc.url === document.url);
  const keptIds = new Set(documents.flatMap((document) => findExisting(document)?.id ?? []));
  const removed = current.documents.filter((document) => !keptIds.has(document.id));
  const staleLikeTargets = [
    ...removed.map((document) => `pdf:${document.id}`),
    ...(data.youtubeUrl ? [] : ["youtube"]),
    ...(data.spotifyUrl ? [] : ["spotify"]),
  ];

  await prisma.$transaction([
    prisma.teachingCategory.deleteMany({ where: { teachingId: id } }),
    prisma.teachingDocument.deleteMany({ where: { id: { in: removed.map((document) => document.id) } } }),
    prisma.mediaLike.deleteMany({ where: { teachingId: id, target: { in: staleLikeTargets } } }),
    ...documents.map((document, order) => {
      const existingDoc = findExisting(document);
      return existingDoc
        ? prisma.teachingDocument.update({ where: { id: existingDoc.id }, data: { fileName: document.fileName, order } })
        : prisma.teachingDocument.create({
            data: { teachingId: id, url: document.url, fileName: document.fileName, order },
          });
    }),
    prisma.teaching.update({
      where: { id },
      data: {
        ...data,
        publishedAt:
          data.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      },
    }),
  ]);

  await Promise.all(removed.map((document) => deleteFile(document.url).catch(() => {})));

  revalidatePath("/admin/enseignements");
  revalidatePath("/enseignements");
  revalidatePath(`/enseignements/${data.slug}`);
  revalidatePath("/");

  const savedDocuments = await prisma.teachingDocument.findMany({
    where: { teachingId: id },
    orderBy: { order: "asc" },
    select: { id: true, url: true, fileName: true },
  });

  return {
    success: "Les modifications ont été enregistrées avec succès.",
    warnings: getTeachingWarnings(data),
    documents: savedDocuments,
  };
}

export async function deleteTeaching(id: string) {
  await requireSession();
  const teaching = await prisma.teaching.findUnique({ where: { id }, include: { documents: true } });
  if (!teaching) return;

  // les documents et les "j'aime" sont supprimes en cascade par la base
  await prisma.teaching.delete({ where: { id } });

  const fileUrls = [...teaching.documents.map((document) => document.url), teaching.coverImageUrl];
  await Promise.all(fileUrls.map((url) => (url ? deleteFile(url).catch(() => {}) : null)));

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
