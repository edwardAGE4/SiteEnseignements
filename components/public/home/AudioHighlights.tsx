import Link from "next/link";
import type { ResourceCardData } from "@/lib/resources";
import { formatDurationHuman } from "@/lib/media";
import { resourceSummary } from "@/lib/utils";
import { ResourceVisual } from "@/components/public/ResourceVisual";
import { AudioPlayer } from "@/components/public/AudioPlayer";
import { ArrowRightIcon, SpotifyIcon } from "@/components/ui/Icons";

/** Audios mis en avant : lecteur compact quand un fichier audio est disponible. */
export function AudioHighlights({ audios }: { audios: ResourceCardData[] }) {
  return (
    <ul className="grid gap-5 lg:grid-cols-3">
      {audios.map((audio) => {
        const category = audio.categories[0]?.category.name;
        const duration = formatDurationHuman(audio.durationSeconds);
        return (
          <li key={audio.id} className="reveal">
            <article className="flex h-full flex-col rounded-3xl bg-white p-5 ring-1 ring-navy-900/[0.07]">
              <div className="flex items-start gap-4">
                <ResourceVisual resource={audio} className="aspect-square w-20 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  {category || duration ? (
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-600">
                      {[category, duration].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  <h3 className="mt-1.5 font-display text-lg font-medium leading-snug text-navy-900">
                    <Link href={`/audios/${audio.slug}`} className="hover:underline underline-offset-4">
                      {audio.title}
                    </Link>
                  </h3>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-500">{resourceSummary(audio, 140)}</p>
              <div className="mt-auto pt-5">
                {audio.audioUrl ? (
                  <AudioPlayer src={audio.audioUrl} title={audio.title} knownDuration={audio.durationSeconds} compact />
                ) : (
                  <Link
                    href={`/audios/${audio.slug}`}
                    className="flex items-center justify-between rounded-2xl bg-navy-900 px-4 py-3 text-sm font-semibold text-ivory-100 transition-colors hover:bg-navy-700"
                  >
                    <span className="flex items-center gap-3">
                      {audio.spotifyUrl ? <SpotifyIcon className="h-5 w-5 text-[#1ed760]" /> : null}
                      Écouter
                      <span className="sr-only"> : {audio.title}</span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
