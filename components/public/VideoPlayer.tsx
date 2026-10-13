"use client";

import { useState } from "react";
import { parseVideoUrl, VIDEO_PROVIDER_LABELS } from "@/lib/media";
import { PlayIcon } from "@/components/ui/Icons";

/**
 * Lecteur video YouTube / Vimeo. L'iframe n'est chargee qu'au clic sur
 * "Lancer la vidéo" (page plus legere, aucun cookie tiers avant action).
 * Seuls les domaines autorises sont integres (cf. parseVideoUrl).
 */
export function VideoPlayer({ url, title, posterUrl }: { url: string; title: string; posterUrl?: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const video = parseVideoUrl(url);

  if (!video) {
    return (
      <div role="alert" className="flex aspect-video w-full items-center justify-center rounded-3xl bg-navy-900 p-8 text-center text-ivory-100/80">
        Cette vidéo n&apos;est plus disponible.
      </div>
    );
  }

  const poster = posterFailed ? null : (posterUrl ?? video.thumbnailUrl);
  const provider = VIDEO_PROVIDER_LABELS[video.provider];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-navy-950 shadow-[0_30px_60px_-40px_rgba(20,38,61,0.8)]">
      {loaded ? (
        <iframe
          src={`${video.embedUrl}?autoplay=1&rel=0`}
          title={`Lecteur vidéo ${provider} : ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setLoaded(true)} className="group absolute inset-0 h-full w-full">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setPosterFailed(true)}
            />
          ) : null}
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-navy-950/35 transition-colors group-hover:bg-navy-950/45">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-navy-900 shadow-xl transition-transform duration-300 group-hover:scale-105">
              <PlayIcon className="ml-1 h-7 w-7" />
            </span>
            <span className="rounded-full bg-navy-950/60 px-4 py-1.5 text-sm font-semibold text-white">
              Lancer la vidéo
              <span className="sr-only"> : {title}</span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
