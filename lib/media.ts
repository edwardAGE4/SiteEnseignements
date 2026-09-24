const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// Chemins du type /<prefixe>/<id> : /embed/ID, /shorts/ID, /live/ID, /v/ID
const YOUTUBE_PATH_PREFIXES = ["embed", "shorts", "live", "v"];

/**
 * Extrait l'identifiant d'une video YouTube depuis ses differentes formes d'URL :
 * youtube.com/watch?v=ID, youtu.be/ID, youtube.com/{embed,shorts,live,v}/ID,
 * y compris m.youtube.com, music.youtube.com et youtube-nocookie.com.
 */
export function extractYoutubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

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

export function toSpotifyEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("spotify.com")) return null;
    if (parsed.pathname.startsWith("/embed/")) return url;
    return `https://open.spotify.com/embed${parsed.pathname}`;
  } catch {
    return null;
  }
}
