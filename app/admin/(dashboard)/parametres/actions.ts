"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-role";
import { getPastorPortraitUrl, setSetting, SETTING_KEYS } from "@/lib/settings";
import { deleteFile } from "@/lib/storage";
import { biographySchema } from "@/lib/validations/biography";

export type PortraitFormState =
  | { error?: string; success?: string; warnings?: string[]; portraitUrl?: string | null }
  | undefined;

function revalidatePortraitPages() {
  // la photo apparait sur l'accueil (hero + section "a propos") et la page A propos
  revalidatePath("/");
  revalidatePath("/a-propos");
  revalidatePath("/admin/parametres");
}

export async function savePastorPortrait(_prev: PortraitFormState, formData: FormData): Promise<PortraitFormState> {
  await requireAdmin();

  const url = String(formData.get("portraitUrl") ?? "");
  if (!url.startsWith("/uploads/images/") && !/^https?:\/\//.test(url)) {
    return { error: "Sélectionnez d'abord une photo à envoyer." };
  }

  const previous = await getPastorPortraitUrl();
  if (previous === url) {
    return { warnings: ["Cette photo est déjà celle affichée sur le site."], portraitUrl: url };
  }

  await setSetting(SETTING_KEYS.pastorPortraitUrl, url);
  if (previous) await deleteFile(previous).catch(() => {});
  revalidatePortraitPages();

  return {
    success: "La photo du Pasteur Jean-Marc GNALI a été mise à jour sur le site.",
    portraitUrl: url,
  };
}

export async function removePastorPortrait(): Promise<void> {
  await requireAdmin();

  const previous = await getPastorPortraitUrl();
  await setSetting(SETTING_KEYS.pastorPortraitUrl, null);
  if (previous) await deleteFile(previous).catch(() => {});
  revalidatePortraitPages();
}

export type BiographyFormState =
  | { error?: string; success?: string; warnings?: string[]; fieldErrors?: Record<string, string> }
  | undefined;

export async function saveBiography(_prev: BiographyFormState, formData: FormData): Promise<BiographyFormState> {
  await requireAdmin();

  const parsed = biographySchema.safeParse({
    title: formData.get("title"),
    lead: formData.get("lead"),
    body: formData.get("body"),
    quote: formData.get("quote"),
    quoteSource: formData.get("quoteSource"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Veuillez corriger les erreurs du formulaire.", fieldErrors };
  }

  const { title, lead, body, quote, quoteSource } = parsed.data;
  await Promise.all([
    setSetting(SETTING_KEYS.aboutTitle, title),
    // une chaine vide est enregistree telle quelle : le bloc sera masque sur le site
    prisma.siteSetting.upsert({
      where: { key: SETTING_KEYS.aboutLead },
      create: { key: SETTING_KEYS.aboutLead, value: lead },
      update: { value: lead },
    }),
    prisma.siteSetting.upsert({
      where: { key: SETTING_KEYS.aboutBody },
      create: { key: SETTING_KEYS.aboutBody, value: body },
      update: { value: body },
    }),
    prisma.siteSetting.upsert({
      where: { key: SETTING_KEYS.aboutQuote },
      create: { key: SETTING_KEYS.aboutQuote, value: quote },
      update: { value: quote },
    }),
    prisma.siteSetting.upsert({
      where: { key: SETTING_KEYS.aboutQuoteSource },
      create: { key: SETTING_KEYS.aboutQuoteSource, value: quoteSource },
      update: { value: quoteSource },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/a-propos");
  revalidatePath("/admin/parametres");

  const warnings: string[] = [];
  if (!body) warnings.push("La biographie détaillée est vide : seule l'introduction sera affichée.");
  if (!quote) warnings.push("Aucune citation : le bandeau de citation sera masqué sur la page À propos.");
  if (quoteSource && !quote) warnings.push("Une source est renseignée sans citation : elle ne sera pas affichée.");

  return { success: "La biographie a été mise à jour sur la page À propos.", warnings };
}
