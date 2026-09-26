"use client";

import { useState } from "react";
import { extractYoutubeId } from "@/lib/media";

export function VideoEmbed({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const videoId = extractYoutubeId(url);

  if (!videoId) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-navy-950">
      {loaded ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title="Lecteur vidéo YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="group relative h-full w-full"
          aria-label="Lancer la vidéo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-navy-950/30 transition-colors group-hover:bg-navy-950/40">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-navy-950 shadow-lg transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
