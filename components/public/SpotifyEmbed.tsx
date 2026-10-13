"use client";

import { useState } from "react";
import { toSpotifyEmbedUrl, toSpotifyOpenUrl } from "@/lib/media";
import { ExternalIcon, SpotifyIcon } from "@/components/ui/Icons";

/**
 * Lecteur Spotify integre, charge au clic (aucun cookie tiers avant action),
 * avec un lien direct pour ecouter dans l'application Spotify.
 */
export function SpotifyEmbed({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = toSpotifyEmbedUrl(url);
  const openUrl = toSpotifyOpenUrl(url);

  if (!embedUrl || !openUrl) {
    return (
      <p role="alert" className="rounded-2xl border border-orange-300 bg-orange-50 px-5 py-4 text-sm text-orange-900">
        Le lien Spotify de cet audio n&apos;est plus valide.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {loaded ? (
        <iframe
          src={embedUrl}
          title={`Lecteur Spotify : ${title}`}
          className="h-[152px] w-full rounded-2xl"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-navy-900/10 bg-white py-6 text-sm font-semibold text-navy-900 transition-colors hover:border-[#1DB954]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954] text-white">
            <SpotifyIcon className="h-6 w-6" />
          </span>
          Afficher le lecteur Spotify
        </button>
      )}
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 underline-offset-4 hover:underline"
      >
        Écouter sur Spotify
        <ExternalIcon className="h-4 w-4" />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </div>
  );
}
