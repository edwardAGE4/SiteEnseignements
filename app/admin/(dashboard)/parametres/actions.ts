"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-role";
import { getPortraitUrl, setSetting, SETTING_KEYS, SOCIAL_NETWORKS, type SettingKey } from "@/lib/settings";
import { deleteFile } from "@/lib/storage";
import { biographySchema, identitySchema } from "@/lib/validations/biography";

export type PortraitFormState =
  | { error?: string; success?: string; warnings?: string[]; portraitUrl?: string | null }
  | undefined;

export type SettingsFormState =
  | { error?: string; success?: string; warnings?: string[]; fieldErrors?: Record<string, string> }
  | undefined;

function revalidateSite() {
  // photo, biographie et pied de page apparaissent sur toutes les pages publiques
  revalidatePath("/", "layout");
}

/** Enregistre des reglages texte (une valeur vide est conservee : la section est masquee). */
async function saveTexts(values: Partial<Record<SettingKey, string>>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.siteSetting.upsert({ where: { key }, create: { key, value: value ?? "" }, update: { value: value ?? "" } }),
    ),
  );
}

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return fieldErrors;
}

export async function savePastorPortrait(_prev: PortraitFormState, formData: FormData): Promise<PortraitFormState> {
  await requireAdmin();

  const url = String(formData.get("portraitUrl") ?? "");
  if (!url.startsWith("/uploads/images/") && !/^https:\/\//.test(url)) {
    return { error: "Sélectionnez d'abord une photo à envoyer." };
  }

  try {
    const previous = await getPortraitUrl();
    if (previous === url) {
      return { warnings: ["Cette photo est déjà celle affichée sur le site."], portraitUrl: url };
    }

    await setSetting(SETTING_KEYS.pastorPortraitUrl, url);
    if (previous) await deleteFile(previous).catch(() => {});
  } catch (error) {
    console.error("[parametres] photo non enregistree :", error);
    return { error: "La photo n'a pas pu être enregistrée (erreur serveur). Réessayez." };
  }

  revalidateSite();
  return { success: "La photo de Jean-Marc GNALI a été mise à jour sur le site.", portraitUrl: url };
}

export async function removePastorPortrait(): Promise<{ error?: string; success?: string }> {
  await requireAdmin();

  try {
    const previous = await getPortraitUrl();
    await setSetting(SETTING_KEYS.pastorPortraitUrl, null);
    if (previous) await deleteFile(previous).catch(() => {});
  } catch (error) {
    console.error("[parametres] photo non retiree :", error);
    return { error: "La photo n'a pas pu être retirée. Réessayez." };
  }
  revalidateSite();
  return { success: "Photo retirée." };
}

export async function saveBiography(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = biographySchema.safeParse({
    title: formData.get("title") ?? "",
    lead: formData.get("lead") ?? "",
    body: formData.get("body") ?? "",
    approach: formData.get("approach") ?? "",
    quote: formData.get("quote") ?? "",
    quoteSource: formData.get("quoteSource") ?? "",
  });

  if (!parsed.success) {
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  const { title, lead, body, approach, quote, quoteSource } = parsed.data;
  try {
    await saveTexts({
      [SETTING_KEYS.aboutTitle]: title,
      [SETTING_KEYS.aboutLead]: lead,
      [SETTING_KEYS.aboutBody]: body,
      [SETTING_KEYS.aboutApproach]: approach,
      [SETTING_KEYS.aboutQuote]: quote,
      [SETTING_KEYS.aboutQuoteSource]: quoteSource,
    });
  } catch (error) {
    console.error("[parametres] biographie non enregistree :", error);
    return { error: "La biographie n'a pas pu être enregistrée (erreur serveur). Vos saisies sont conservées." };
  }

  revalidateSite();

  const warnings: string[] = [];
  if (!lead && !body) warnings.push("Introduction et biographie vides : la page À propos n'affichera que le nom et la photo.");
  if (quoteSource && !quote) warnings.push("Une source est renseignée sans citation : elle ne sera pas affichée.");

  return { success: "La page À propos a été mise à jour.", warnings };
}

export async function saveIdentity(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin();

  const raw: Record<string, string> = { siteIntro: String(formData.get("siteIntro") ?? "") };
  for (const network of SOCIAL_NETWORKS) raw[network.key] = String(formData.get(network.key) ?? "");

  const parsed = identitySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  try {
    await saveTexts(parsed.data as Partial<Record<SettingKey, string>>);
  } catch (error) {
    console.error("[parametres] identite non enregistree :", error);
    return { error: "Les informations n'ont pas pu être enregistrées (erreur serveur). Réessayez." };
  }

  revalidateSite();
  return { success: "Présentation et réseaux sociaux mis à jour dans le pied de page." };
}
