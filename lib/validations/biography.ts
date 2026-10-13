import { z } from "zod";
import { SOCIAL_NETWORKS } from "@/lib/social";

const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .transform((value) => value.replace(/\r\n/g, "\n"));

export const BIOGRAPHY_LIMITS = { title: 160, lead: 600, body: 20000, approach: 8000, quote: 400, quoteSource: 120 };

// Tous les champs sont facultatifs : une section vide est masquee sur le site.
export const biographySchema = z.object({
  title: text(BIOGRAPHY_LIMITS.title, "Titre"),
  lead: text(BIOGRAPHY_LIMITS.lead, "Introduction"),
  body: text(BIOGRAPHY_LIMITS.body, "Biographie"),
  approach: text(BIOGRAPHY_LIMITS.approach, "Démarche"),
  quote: text(BIOGRAPHY_LIMITS.quote, "Citation"),
  quoteSource: text(BIOGRAPHY_LIMITS.quoteSource, "Source"),
});

const socialUrl = (label: string, hosts: readonly string[]) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        const host = url.hostname.replace(/^(www|m)\./, "");
        return url.protocol === "https:" && hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
      } catch {
        return false;
      }
    }, `${label} : indiquez l'adresse complète de la page (https://...).`);

export const identitySchema = z.object({
  siteIntro: text(400, "Présentation"),
  ...Object.fromEntries(SOCIAL_NETWORKS.map((network) => [network.key, socialUrl(network.label, network.hosts)])),
}) as unknown as z.ZodType<{ siteIntro: string } & Record<(typeof SOCIAL_NETWORKS)[number]["key"], string>>;
