/** Nom public du site, utilise partout (en-tete, pied de page, SEO). */
export const SITE_NAME = "Jean-Marc GNALI";

/** Les six rubriques principales, dans l'ordre du menu. */
export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/audios", label: "Audios" },
  { href: "/videos", label: "Vidéos" },
  { href: "/livres", label: "Livres" },
  { href: "/fichiers-pratiques", label: "Fichiers pratiques" },
] as const;

export const LEGAL_LINKS = [
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/version", label: "Version et mises à jour" },
] as const;
