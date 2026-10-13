"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-role";
import {
  fieldErrorsOf,
  getTeachingWarnings,
  teachingInputFromFormData,
  teachingSchema,
  type TeachingDocumentInput,
} from "@/lib/validations/teaching";
import { deleteFile } from "@/lib/storage";

export type TeachingFormState =
  | {
      error?: string;
      success?: string;
      warnings?: string[];
      fieldErrors?: Record<string, string>;
      /** Documents tels qu'enregistres, pour resynchroniser le formulaire. */
      documents?: DocumentRow[];
    }
  | undefined;

type DocumentRow = { id: string; url: string; fileName: string; mimeType: string | null; sizeBytes: number | null };

export type ActionResult = { error?: string; success?: string };

/** Le contenu public (accueil, rubriques, fiches, sitemap) est regenere apres chaque modification. */
function revalidatePublicSite() {
  revalidatePath("/", "layout");
}

function parseTeachingForm(formData: FormData) {
  return teachingSchema.safeParse(teachingInputFromFormData(formData));
}

function toDocumentRows(documents: TeachingDocumentInput[]) {
  return documents.map((document, index) => ({
    url: document.url,
    fileName: document.fileName,
    mimeType: document.mimeType ?? null,
    sizeBytes: document.sizeBytes ?? null,
    order: index,
  }));
}

/** Date de publication : celle saisie, sinon conservee, sinon maintenant (a la premiere publication). */
function resolvePublishedAt(status: string, chosen: Date | undefined, current: Date | null) {
  if (chosen) return chosen;
  if (status === "PUBLISHED") return current ?? new Date();
  return current;
}

async function existingCategoryIds(ids: string[]) {
  if (ids.length === 0) return [];
  const found = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return found.map((category) => category.id);
}

export async function createTeaching(_prevState: TeachingFormState, formData: FormData): Promise<TeachingFormState> {
  const session = await requireSession();
  const parsed = parseTeachingForm(formData);

  if (!parsed.success) {
    return { error: "Veuillez corriger les erreurs signalées dans le formulaire.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  const { categoryIds, documents, duration, publishedAt, ...data } = parsed.data;
  let createdId: string;

  try {
    const existing = await prisma.teaching.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (existing) {
      return { error: "Cette adresse (slug) est déjà utilisée par une autre ressource.", fieldErrors: { slug: "Slug déjà utilisé." } };
    }

    const validCategoryIds = await existingCategoryIds(categoryIds);
    const created = await prisma.teaching.create({
      data: {
        ...data,
        durationSeconds: duration,
        publishedAt: resolvePublishedAt(data.status, publishedAt, null),
        createdById: session.user.id,
        categories: { create: validCategoryIds.map((categoryId) => ({ categoryId })) },
        documents: { create: toDocumentRows(documents) },
      },
      select: { id: true },
    });
    createdId = created.id;
  } catch (error) {
    console.error("[ressources] creation impossible :", error);
    return { error: "L'enregistrement a échoué (erreur serveur). Vos saisies sont conservées : réessayez dans un instant." };
  }

  revalidatePublicSite();
  // redirection apres l'enregistrement effectif uniquement
  redirect(`/admin/enseignements/${createdId}/modifier?statut=cree`);
}

export async function updateTeaching(
  id: string,
  _prevState: TeachingFormState,
  formData: FormData,
): Promise<TeachingFormState> {
  await requireSession();
  const parsed = parseTeachingForm(formData);

  if (!parsed.success) {
    return { error: "Veuillez corriger les erreurs signalées dans le formulaire.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  const { categoryIds, documents, duration, publishedAt, ...data } = parsed.data;

  try {
    const existing = await prisma.teaching.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (existing && existing.id !== id) {
      return { error: "Cette adresse (slug) est déjà utilisée par une autre ressource.", fieldErrors: { slug: "Slug déjà utilisé." } };
    }

    const current = await prisma.teaching.findUnique({ where: { id }, include: { documents: true } });
    if (!current) {
      return { error: "Cette ressource n'existe plus (elle a peut-être été supprimée)." };
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
      ...(data.videoUrl ? [] : ["youtube"]),
      ...(data.spotifyUrl ? [] : ["spotify"]),
      ...(data.audioUrl ? [] : ["audio"]),
    ];
    const validCategoryIds = await existingCategoryIds(categoryIds);

    await prisma.$transaction([
      prisma.teachingCategory.deleteMany({ where: { teachingId: id } }),
      prisma.teachingDocument.deleteMany({ where: { id: { in: removed.map((document) => document.id) } } }),
      prisma.mediaLike.deleteMany({ where: { teachingId: id, target: { in: staleLikeTargets } } }),
      ...documents.map((document, order) => {
        const existingDoc = findExisting(document);
        return existingDoc
          ? prisma.teachingDocument.update({ where: { id: existingDoc.id }, data: { fileName: document.fileName, order } })
          : prisma.teachingDocument.create({
              data: {
                teachingId: id,
                url: document.url,
                fileName: document.fileName,
                mimeType: document.mimeType ?? null,
                sizeBytes: document.sizeBytes ?? null,
                order,
              },
            });
      }),
      prisma.teaching.update({
        where: { id },
        data: {
          ...data,
          // champs facultatifs vides : effaces en base
          excerpt: data.excerpt ?? null,
          videoUrl: data.videoUrl ?? null,
          spotifyUrl: data.spotifyUrl ?? null,
          audioUrl: data.audioUrl ?? null,
          series: data.series ?? null,
          subtitle: data.subtitle ?? null,
          author: data.author ?? null,
          isbn: data.isbn ?? null,
          readUrl: data.readUrl ?? null,
          purchaseUrl: data.purchaseUrl ?? null,
          coverImageUrl: data.coverImageUrl ?? null,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          durationSeconds: duration,
          publishedAt: resolvePublishedAt(data.status, publishedAt, current.publishedAt),
          categories: { create: validCategoryIds.map((categoryId) => ({ categoryId })) },
        },
      }),
    ]);

    // fichiers qui ne sont plus utilises : supprimes du stockage apres l'enregistrement
    const orphanUrls = [
      ...removed.map((document) => document.url),
      current.audioUrl && current.audioUrl !== data.audioUrl ? current.audioUrl : null,
      current.coverImageUrl && current.coverImageUrl !== data.coverImageUrl ? current.coverImageUrl : null,
    ].filter((url): url is string => Boolean(url));
    await Promise.all(orphanUrls.map((url) => deleteFile(url).catch(() => {})));

    revalidatePublicSite();

    const savedDocuments = await prisma.teachingDocument.findMany({
      where: { teachingId: id },
      orderBy: { order: "asc" },
      select: { id: true, url: true, fileName: true, mimeType: true, sizeBytes: true },
    });

    return {
      success: "Les modifications ont été enregistrées.",
      warnings: getTeachingWarnings({ ...data, publishedAt: resolvePublishedAt(data.status, publishedAt, current.publishedAt) }),
      documents: savedDocuments,
    };
  } catch (error) {
    console.error("[ressources] mise a jour impossible :", error);
    return { error: "L'enregistrement a échoué (erreur serveur). Vos saisies sont conservées : réessayez dans un instant." };
  }
}

export async function deleteTeaching(id: string): Promise<ActionResult> {
  await requireSession();
  try {
    const teaching = await prisma.teaching.findUnique({ where: { id }, include: { documents: true } });
    if (!teaching) return { error: "Cette ressource a déjà été supprimée." };

    // les documents et les "j'aime" sont supprimes en cascade par la base
    await prisma.teaching.delete({ where: { id } });

    const fileUrls = [...teaching.documents.map((document) => document.url), teaching.coverImageUrl, teaching.audioUrl];
    await Promise.all(fileUrls.map((url) => (url ? deleteFile(url).catch(() => {}) : null)));
  } catch (error) {
    console.error("[ressources] suppression impossible :", error);
    return { error: "La suppression a échoué. Réessayez." };
  }

  revalidatePublicSite();
  revalidatePath("/admin/enseignements");
  return { success: "Ressource supprimée." };
}

export async function setTeachingStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<ActionResult> {
  await requireSession();
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) return { error: "Statut inconnu." };

  try {
    const teaching = await prisma.teaching.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!teaching) return { error: "Cette ressource n'existe plus." };

    await prisma.teaching.update({
      where: { id },
      data: { status, publishedAt: status === "PUBLISHED" ? (teaching.publishedAt ?? new Date()) : teaching.publishedAt },
    });
  } catch (error) {
    console.error("[ressources] changement de statut impossible :", error);
    return { error: "Le changement de statut a échoué. Réessayez." };
  }

  revalidatePublicSite();
  revalidatePath("/admin/enseignements");
  const labels = { DRAFT: "Ressource dépubliée (brouillon).", PUBLISHED: "Ressource publiée.", ARCHIVED: "Ressource archivée." };
  return { success: labels[status] };
}
