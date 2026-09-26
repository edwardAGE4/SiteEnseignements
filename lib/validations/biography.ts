import { z } from "zod";

const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} : ${max} caractères maximum.`)
    .transform((value) => value.replace(/\r\n/g, "\n"));

export const BIOGRAPHY_LIMITS = { title: 120, lead: 500, body: 20000, quote: 400, quoteSource: 120 };

export const biographySchema = z.object({
  title: text(BIOGRAPHY_LIMITS.title, "Titre").pipe(z.string().min(1, "Le titre est obligatoire.")),
  lead: text(BIOGRAPHY_LIMITS.lead, "Introduction"),
  body: text(BIOGRAPHY_LIMITS.body, "Biographie"),
  quote: text(BIOGRAPHY_LIMITS.quote, "Citation"),
  quoteSource: text(BIOGRAPHY_LIMITS.quoteSource, "Source"),
});
