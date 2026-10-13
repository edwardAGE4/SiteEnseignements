import type { ResourceType } from "@/generated/prisma/enums";

/* ------------------------------------------------------------------ */
/* Rubriques                                                           */
/* ------------------------------------------------------------------ */

export type Section = "audios" | "videos" | "livres" | "fichiers-pratiques";

export type SectionConfig = {
  section: Section;
  type: ResourceType;
  path: `/${Section}`;
  label: string;
  singular: string;
  /** "un audio", "une vidéo"... */
  article: string;
  description: string;
  emptyTitle: string;
  /** "Tous les audios", "Toutes les vidéos"... */
  allLabel: string;
};

export const SECTIONS: Record<Section, SectionConfig> = {
  audios: {
    section: "audios",
    type: "AUDIO",
    path: "/audios",
    label: "Audios",
    singular: "Audio",
    article: "un audio",
    description: "Écoutez les enseignements et contenus audio.",
    emptyTitle: "Aucun audio pour le moment",
    allLabel: "Tous les audios",
  },
  videos: {
    section: "videos",
    type: "VIDEO",
    path: "/videos",
    label: "Vidéos",
    singular: "Vidéo",
    article: "une vidéo",
    description: "Regardez les enseignements et contenus vidéo.",
    emptyTitle: "Aucune vidéo pour le moment",
    allLabel: "Toutes les vidéos",
  },
  livres: {
    section: "livres",
    type: "BOOK",
    path: "/livres",
    label: "Livres",
    singular: "Livre",
    article: "un livre",
    description: "Découvrez les livres et publications disponibles.",
    emptyTitle: "Aucun livre pour le moment",
    allLabel: "Tous les livres",
  },
  "fichiers-pratiques": {
    section: "fichiers-pratiques",
    type: "FILE",
    path: "/fichiers-pratiques",
    label: "Fichiers pratiques",
    singular: "Fichier pratique",
    article: "un fichier pratique",
    description: "Consultez et téléchargez les ressources pratiques disponibles.",
    emptyTitle: "Aucun fichier pratique pour le moment",
    allLabel: "Tous les fichiers pratiques",
  },
};

export const SECTION_LIST = Object.values(SECTIONS);

export const TYPE_TO_SECTION: Record<ResourceType, Section> = {
  AUDIO: "audios",
  VIDEO: "videos",
  BOOK: "livres",
  FILE: "fichiers-pratiques",
};

export const TYPE_LABELS: Record<ResourceType, string> = {
  AUDIO: "Audio",
  VIDEO: "Vidéo",
  BOOK: "Livre",
  FILE: "Fichier pratique",
};

export const RESOURCE_TYPES: ResourceType[] = ["AUDIO", "VIDEO", "BOOK", "FILE"];

export function isResourceType(value: unknown): value is ResourceType {
  return typeof value === "string" && (RESOURCE_TYPES as string[]).includes(value);
}

/** URL publique de reference (canonique) d'une ressource : celle de sa rubrique. */
export function resourcePath(resource: { type: ResourceType; slug: string }): string {
  return `/${TYPE_TO_SECTION[resource.type]}/${resource.slug}`;
}

/* Tri des listes */

export type ResourceSort = "recent" | "ancien" | "alpha" | "popular";
export const RESOURCE_SORTS: { value: ResourceSort; label: string }[] = [
  { value: "recent", label: "Plus récents" },
  { value: "ancien", label: "Plus anciens" },
  { value: "alpha", label: "Alphabétique" },
  { value: "popular", label: "Plus consultés" },
];

export function parseSort(value: string | undefined): ResourceSort {
  return RESOURCE_SORTS.some((sort) => sort.value === value) ? (value as ResourceSort) : "recent";
}

