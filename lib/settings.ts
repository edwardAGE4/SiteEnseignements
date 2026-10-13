import { prisma } from "@/lib/prisma";
import { SOCIAL_NETWORKS, type SocialKey } from "@/lib/social";

export { SOCIAL_NETWORKS, type SocialKey };

export { SITE_NAME } from "@/lib/site";

/** Cles des reglages modifiables depuis l'espace admin (table site_settings). */
export const SETTING_KEYS = {
  // cle historique conservee pour ne pas perdre la photo deja enregistree
  pastorPortraitUrl: "pastorPortraitUrl",
  aboutTitle: "aboutTitle",
  aboutLead: "aboutLead",
  aboutBody: "aboutBody",
  aboutApproach: "aboutApproach",
  aboutQuote: "aboutQuote",
  aboutQuoteSource: "aboutQuoteSource",
  siteIntro: "siteIntro",
  socialFacebook: "socialFacebook",
  socialInstagram: "socialInstagram",
  socialYoutube: "socialYoutube",
  socialSpotify: "socialSpotify",
  socialTiktok: "socialTiktok",
  socialX: "socialX",
  socialLinkedin: "socialLinkedin",
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

async function getSettings<K extends SettingKey>(keys: readonly K[]): Promise<Record<K, string>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...keys] } } });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return Object.fromEntries(keys.map((key) => [key, values[key] ?? ""])) as Record<K, string>;
}

/** Photographie de Jean-Marc GNALI (Admin > Parametres). */
export function getPortraitUrl() {
  return getSetting(SETTING_KEYS.pastorPortraitUrl);
}

/* ------------------------------------------------------------------ */
/* Biographie (page A propos)                                          */
/* ------------------------------------------------------------------ */

export type Biography = {
  title: string;
  lead: string;
  body: string;
  approach: string;
  quote: string;
  quoteSource: string;
};

export const EMPTY_BIOGRAPHY: Biography = { title: "", lead: "", body: "", approach: "", quote: "", quoteSource: "" };

const BIOGRAPHY_KEYS = [
  SETTING_KEYS.aboutTitle,
  SETTING_KEYS.aboutLead,
  SETTING_KEYS.aboutBody,
  SETTING_KEYS.aboutApproach,
  SETTING_KEYS.aboutQuote,
  SETTING_KEYS.aboutQuoteSource,
] as const;

/**
 * Biographie enregistree. Les champs non renseignes sont vides et les sections
 * correspondantes sont masquees sur le site : aucun texte n'est invente.
 */
export async function getBiography(): Promise<Biography> {
  const values = await getSettings(BIOGRAPHY_KEYS);
  return {
    title: values.aboutTitle,
    lead: values.aboutLead,
    body: values.aboutBody,
    approach: values.aboutApproach,
    quote: values.aboutQuote,
    quoteSource: values.aboutQuoteSource,
  };
}

/* ------------------------------------------------------------------ */
/* Presentation courte et reseaux sociaux (pied de page)              */
/* ------------------------------------------------------------------ */


export type SiteIdentity = {
  intro: string;
  socials: { key: SocialKey; label: string; url: string }[];
  /** valeurs brutes, pour le formulaire d'administration */
  socialValues: Record<SocialKey, string>;
};

export async function getSiteIdentity(): Promise<SiteIdentity> {
  const keys = [SETTING_KEYS.siteIntro, ...SOCIAL_NETWORKS.map((network) => network.key)] as const;
  const values = await getSettings(keys);
  const socialValues = Object.fromEntries(
    SOCIAL_NETWORKS.map((network) => [network.key, values[network.key]]),
  ) as Record<SocialKey, string>;

  return {
    intro: values.siteIntro,
    socials: SOCIAL_NETWORKS.filter((network) => values[network.key]).map((network) => ({
      key: network.key,
      label: network.label,
      url: values[network.key],
    })),
    socialValues,
  };
}

/** Lecture tolerante (le site reste affichable si la base est momentanement indisponible). */
export async function getSiteIdentitySafe(): Promise<SiteIdentity> {
  try {
    return await getSiteIdentity();
  } catch (error) {
    console.error("[settings] Lecture de l'identite du site impossible :", error);
    return {
      intro: "",
      socials: [],
      socialValues: Object.fromEntries(SOCIAL_NETWORKS.map((network) => [network.key, ""])) as Record<SocialKey, string>,
    };
  }
}
