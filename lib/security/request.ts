/**
 * Vrai si la requete vient d'une page du site lui-meme (et non d'un autre
 * site qui ferait agir le visiteur a son insu). Utilise par les routes
 * publiques qui modifient des donnees (j'aime, compteur de vues). Les
 * actions serveur de Next font deja ce controle.
 */
export function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";

  // navigateurs anciens : comparaison de l'en-tete Origin avec l'hote
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}
