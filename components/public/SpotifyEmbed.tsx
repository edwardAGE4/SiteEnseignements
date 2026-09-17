"use client";

import { useState } from "react";
import { toSpotifyEmbedUrl } from "@/lib/media";

export function SpotifyEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = toSpotifyEmbedUrl(url);

  if (!embedUrl) return null;

  if (!loaded) {
    return (
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-ink-900/10 bg-ivory-50 py-6 font-accent text-sm font-medium text-navy-900 transition-colors hover:border-gold-400"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.4a.62.62 0 0 1-.86.2c-2.36-1.44-5.32-1.77-8.82-.97a.62.62 0 1 1-.28-1.21c3.83-.87 7.12-.5 9.76 1.12.3.18.4.57.2.86Zm1.22-2.71a.78.78 0 0 1-1.07.26c-2.7-1.66-6.82-2.14-10.02-1.17a.78.78 0 1 1-.45-1.49c3.66-1.1 8.2-.57 11.28 1.32.37.23.49.72.26 1.08Zm.11-2.83C14.9 9 8.94 8.8 5.5 9.86a.93.93 0 1 1-.55-1.78c3.95-1.2 10.5-.97 14.14 1.2a.93.93 0 0 1-.97 1.58Z" />
          </svg>
        </span>
        Ecouter sur Spotify
      </button>
    );
  }

  return (
    <iframe
      src={embedUrl}
      title="Lecteur audio Spotify"
      className="h-[152px] w-full rounded-2xl"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
