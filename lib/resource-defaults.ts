import type { ResourceType } from "@/generated/prisma/enums";

/* Valeurs initiales du formulaire de ressource (module partage serveur / navigateur). */

/** Fichier joint du formulaire. `id` absent = envoye mais pas encore enregistre. */
type DocumentItem = { id?: string; url: string; fileName: string; mimeType?: string | null; sizeBytes?: number | null };

export type ResourceDefaults = {
  type: ResourceType;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  videoUrl: string;
  spotifyUrl: string;
  audioUrl: string;
  duration: string;
  series: string;
  subtitle: string;
  author: string;
  isbn: string;
  bookFormats: string[];
  readUrl: string;
  purchaseUrl: string;
  downloadPolicy: "DOWNLOAD" | "VIEW_ONLY";
  documents: DocumentItem[];
  coverImageUrl: string;
  tags: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  categoryIds: string[];
};

export function emptyResourceDefaults(type: ResourceType): ResourceDefaults {
  return {
    type,
    title: "",
    slug: "",
    excerpt: "",
    description: "",
    videoUrl: "",
    spotifyUrl: "",
    audioUrl: "",
    duration: "",
    series: "",
    subtitle: "",
    author: "",
    isbn: "",
    bookFormats: [],
    readUrl: "",
    purchaseUrl: "",
    downloadPolicy: "DOWNLOAD",
    documents: [],
    coverImageUrl: "",
    tags: "",
    status: "DRAFT",
    featured: false,
    publishedAt: "",
    seoTitle: "",
    seoDescription: "",
    categoryIds: [],
  };
}

