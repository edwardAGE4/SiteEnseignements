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

const bursts = new Map<string, number[]>();

/**
 * Limite a `max` requetes par fenetre glissante de `windowMs` (ex. 10 envois
 * par minute), contrairement a isRateLimited qui impose un delai entre deux appels.
 */
export function exceedsRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (bursts.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= max) {
    bursts.set(key, recent);
    return true;
  }

  recent.push(now);
  bursts.set(key, recent);
  return false;
}
