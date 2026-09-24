/**
 * URL publique du site (SEO, sitemap, donnees structurees).
 * Ordre de priorite :
 * 1. NEXT_PUBLIC_SITE_URL (a definir en production, ex. https://mon-domaine.fr)
 * 2. VERCEL_PROJECT_PRODUCTION_URL puis VERCEL_URL, fournies automatiquement par
 *    Vercel (sans protocole, ex. mon-projet.vercel.app)
 * 3. http://localhost:3000 en developpement
 * Une valeur vide ou invalide est ignoree au lieu de faire echouer le build.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      return new URL(/^https?:\/\//.test(value) ? value : `https://${value}`).origin;
    } catch {
      // valeur invalide : on essaie la suivante
    }
  }

  return "http://localhost:3000";
}
