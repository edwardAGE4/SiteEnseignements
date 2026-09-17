/**
 * Limiteur de frequence en memoire, pense pour un deploiement mono-instance.
 * Suffisant pour freiner les rafraichissements abusifs sur les compteurs
 * de vues/telechargements sans dependance externe (Redis, etc.).
 */
const hits = new Map<string, number>();

const WINDOW_MS = 5 * 60 * 1000;

export function isRateLimited(key: string, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const last = hits.get(key);

  if (last && now - last < windowMs) {
    return true;
  }

  hits.set(key, now);

  if (hits.size > 5000) {
    const cutoff = now - windowMs;
    for (const [k, timestamp] of hits) {
      if (timestamp < cutoff) hits.delete(k);
    }
  }

  return false;
}
