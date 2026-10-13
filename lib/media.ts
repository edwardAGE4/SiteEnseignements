const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

// Chemins du type /<prefixe>/<id> : /embed/ID, /shorts/ID, /live/ID, /v/ID
const YOUTUBE_PATH_PREFIXES = ["embed", "shorts", "live", "v"];

function parseUrl(url: string): URL | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Extrait l'identifiant d'une video YouTube depuis ses differentes formes d'URL :
 * youtube.com/watch?v=ID, youtu.be/ID, youtube.com/{embed,shorts,live,v}/ID,
 * y compris m.youtube.com, music.youtube.com et youtube-nocookie.com.
 */
export function extractYoutubeId(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed) return null;

  const host = parsed.hostname.replace(/^(www|m|music)\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);
  let candidate: string | null | undefined = null;

  if (host === "youtu.be") {
    candidate = segments[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (segments[0] === "watch") candidate = parsed.searchParams.get("v");
    else if (YOUTUBE_PATH_PREFIXES.includes(segments[0])) candidate = segments[1];
  }

  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

/** Identifiant d'une video Vimeo : vimeo.com/ID, vimeo.com/channels/x/ID, player.vimeo.com/video/ID. */
export function extractVimeoId(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const candidate = parsed.pathname.split("/").filter(Boolean).find((segment) => VIMEO_ID.test(segment));
  return candidate ?? null;
}

export type VideoProvider = "youtube" | "vimeo";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  /** URL du lecteur integre (domaines autorises uniquement). */
  embedUrl: string;
  /** Miniature publique, quand le fournisseur en propose une sans appel d'API. */
  thumbnailUrl: string | null;
  /** Page de la video chez le fournisseur. */
  watchUrl: string;
};

export const VIDEO_PROVIDER_LABELS: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
};

/**
 * Reconnait une URL de video autorisee (YouTube ou Vimeo). Toute autre URL est
 * refusee : on ne genere jamais d'iframe vers un domaine arbitraire.
 */
export function parseVideoUrl(url: string | null | undefined): ParsedVideo | null {
  if (!url) return null;

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return {
      provider: "youtube",
      id: youtubeId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      provider: "vimeo",
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      thumbnailUrl: null,
      watchUrl: `https://vimeo.com/${vimeoId}`,
    };
  }

  return null;
}

const SPOTIFY_KINDS = ["episode", "track", "show", "album", "playlist"];
const SPOTIFY_ID = /^[A-Za-z0-9]{10,40}$/;

/** Contenu Spotify reconnu : type (episode, track...) et identifiant. */
export function parseSpotifyUrl(url: string | null | undefined): { kind: string; id: string } | null {
  if (!url) return null;
  const parsed = parseUrl(url);
  if (!parsed || parsed.hostname !== "open.spotify.com") return null;

  // /episode/ID, /embed/episode/ID, /intl-fr/episode/ID
  const segments = parsed.pathname.split("/").filter((segment) => segment && segment !== "embed" && !segment.startsWith("intl-"));
  const [kind, id] = segments;
  if (!SPOTIFY_KINDS.includes(kind) || !id || !SPOTIFY_ID.test(id)) return null;
  return { kind, id };
}

export function toSpotifyEmbedUrl(url: string): string | null {
  const parsed = parseSpotifyUrl(url);
  return parsed ? `https://open.spotify.com/embed/${parsed.kind}/${parsed.id}` : null;
}

export function toSpotifyOpenUrl(url: string): string | null {
  const parsed = parseSpotifyUrl(url);
  return parsed ? `https://open.spotify.com/${parsed.kind}/${parsed.id}` : null;
}

/** "1:02:05" / "42:10" / "45" (minutes) -> secondes. null si illisible. */
export function parseDuration(input: string | null | undefined): number | null {
  const value = (input ?? "").trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value) * 60;
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, hours, minutes, seconds] = match;
  if (Number(seconds) > 59 || (hours && Number(minutes) > 59)) return null;
  return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds);
}

/** Secondes -> "1:02:05" ou "42:10". */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return "";
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Secondes -> "PT1H2M5S" (donnees structurees schema.org). */
export function toIsoDuration(totalSeconds: number | null | undefined): string | undefined {
  if (!totalSeconds) return undefined;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds ? `${seconds}S` : ""}` || undefined;
}

/** Duree lisible pour un visiteur : "45 min", "1 h 05". */
export function formatDurationHuman(totalSeconds: number | null | undefined): string {
  if (!totalSeconds) return "";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** Taille de fichier lisible : "850 Ko", "2,4 Mo". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}
