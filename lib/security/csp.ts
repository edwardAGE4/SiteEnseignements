/**
 * Content-Security-Policy du site : liste blanche de tout ce que les pages
 * ont le droit de charger (scripts, images, iframes, connexions...).
 * - Site public (pages en cache ISR) : pas de nonce possible, les scripts en
 *   ligne de Next sont donc autorises ('unsafe-inline'), mais jamais eval ni
 *   aucun script externe.
 * - Administration (rendue a chaque requete) : nonce + 'strict-dynamic',
 *   seuls les scripts emis par Next pour cette requete s'executent.
 * Utilise par next.config.ts (public) et proxy.ts (admin).
 */

const isDev = process.env.NODE_ENV === "development";

function origin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Stockage des fichiers (Vercel Blob, S3 / Supabase) : lecture des medias, envoi direct depuis l'admin. */
function storageOrigins(): string[] {
  return [
    "https://*.public.blob.vercel-storage.com",
    origin(process.env.S3_PUBLIC_URL),
    origin(process.env.S3_ENDPOINT),
    process.env.S3_BUCKET && process.env.S3_REGION
      ? `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`
      : null,
  ].filter((value): value is string => Boolean(value));
}

const EMBED_ORIGINS = [
  "https://www.youtube-nocookie.com",
  "https://www.youtube.com",
  "https://player.vimeo.com",
  "https://open.spotify.com",
];

function serialize(directives: Record<string, string[]>) {
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" ").trim())
    .join("; ");
}

function baseDirectives(): Record<string, string[]> {
  const storage = storageOrigins();
  return {
    "default-src": ["'self'"],
    // les images peuvent venir de couvertures externes (miniatures YouTube, stockage...)
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "media-src": ["'self'", "blob:", ...storage],
    "font-src": ["'self'"],
    // attributs style="" (React) : non couverts par un nonce
    "style-src": ["'self'", "'unsafe-inline'"],
    "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
    "frame-src": EMBED_ORIGINS,
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
  };
}

/** CSP des pages publiques (fixe, compatible avec le cache). */
export function publicCsp(): string {
  return serialize({
    ...baseDirectives(),
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  });
}

/** CSP de l'administration, avec le nonce de la requete. */
export function adminCsp(nonce: string): string {
  const base = baseDirectives();
  return serialize({
    ...base,
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // envoi direct des fichiers vers le stockage depuis le navigateur
    "connect-src": [...base["connect-src"], "https://vercel.com", ...storageOrigins()],
  });
}
