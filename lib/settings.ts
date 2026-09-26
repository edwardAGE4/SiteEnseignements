import { prisma } from "@/lib/prisma";

/** Cles des reglages modifiables depuis l'espace admin (table site_settings). */
export const SETTING_KEYS = {
  pastorPortraitUrl: "pastorPortraitUrl",
  aboutTitle: "aboutTitle",
  aboutLead: "aboutLead",
  aboutBody: "aboutBody",
  aboutQuote: "aboutQuote",
  aboutQuoteSource: "aboutQuoteSource",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSetting(key: SettingKey): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value || null;
}

export async function setSetting(key: SettingKey, value: string | null): Promise<void> {
  if (value) {
    await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  } else {
    await prisma.siteSetting.deleteMany({ where: { key } });
  }
}

export function getPastorPortraitUrl() {
  return getSetting(SETTING_KEYS.pastorPortraitUrl);
}

/** Textes affiches tant que la biographie n'a pas ete renseignee dans l'admin. */
export const DEFAULT_BIOGRAPHY = {
  title: "Une mission.\nUne transmission.",
  lead: "Un contenu à compléter par le propriétaire du site.",
  body:
    "Cette page est prévue pour accueillir le parcours, la vision et la vocation d'enseignement du Pasteur Jean-Marc GNALI, rédigé à la manière d'un récit éditorial plutôt que d'une fiche administrative.\n\n" +
    "Conformément aux exigences du projet, aucune information biographique n'a été inventée : le texte définitif doit être fourni par le Pasteur Jean-Marc GNALI ou par le propriétaire de la plateforme, puis intégré ici.",
  quote: "La transmission commence toujours par une compréhension nouvelle.",
  quoteSource: "",
};

export type Biography = typeof DEFAULT_BIOGRAPHY;

/** Biographie enregistree, sans valeurs par defaut (champs vides si non renseignes). */
export async function getSavedBiography(): Promise<Biography | null> {
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          SETTING_KEYS.aboutTitle,
          SETTING_KEYS.aboutLead,
          SETTING_KEYS.aboutBody,
          SETTING_KEYS.aboutQuote,
          SETTING_KEYS.aboutQuoteSource,
        ],
      },
    },
  });
  if (rows.length === 0) return null;

  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    title: values[SETTING_KEYS.aboutTitle] ?? "",
    lead: values[SETTING_KEYS.aboutLead] ?? "",
    body: values[SETTING_KEYS.aboutBody] ?? "",
    quote: values[SETTING_KEYS.aboutQuote] ?? "",
    quoteSource: values[SETTING_KEYS.aboutQuoteSource] ?? "",
  };
}

/**
 * Biographie a afficher sur le site. Tant que rien n'a ete enregistre, on montre
 * les textes par defaut ; ensuite, un champ laisse vide est simplement masque
 * (sauf le titre, indispensable a la mise en page).
 */
export async function getBiography(): Promise<Biography> {
  const saved = await getSavedBiography();
  if (!saved) return DEFAULT_BIOGRAPHY;
  return { ...saved, title: saved.title || DEFAULT_BIOGRAPHY.title };
}
