import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return DATE_FORMATTER.format(new Date(date));
}

export function formatYear(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).getFullYear().toString();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** Texte comparable pour une recherche : sans accents ni majuscules. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Vrai si chaque mot de la recherche apparait dans l'un des champs. */
export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSearch(fields.filter(Boolean).join(" "));
  return words.every((word) => haystack.includes(word));
}

/**
 * Vrai si le clic vise un element interactif (lien, bouton, champ, fenetre
 * modale) : une ligne de tableau cliquable ne doit alors pas reagir.
 */
export function isInteractiveClick(event: { target: EventTarget | null }): boolean {
  return event.target instanceof Element && Boolean(event.target.closest("a, button, input, select, textarea, label, dialog"));
}
