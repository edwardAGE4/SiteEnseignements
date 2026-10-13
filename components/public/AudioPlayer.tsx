"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatDuration } from "@/lib/media";
import { cn } from "@/lib/utils";
import { PauseIcon, PlayIcon, VolumeIcon } from "@/components/ui/Icons";

/** Un seul lecteur joue a la fois sur la page. */
const PLAY_EVENT = "jmg:audio-play";

/**
 * Lecteur audio HTML5 : lecture / pause, progression, temps, volume.
 * Aucune lecture automatique ; le fichier n'est charge qu'a la demande
 * (preload="metadata"). Message clair si le fichier est inaccessible.
 */
export function AudioPlayer({
  src,
  title,
  knownDuration,
  compact = false,
  className,
}: {
  src: string;
  title: string;
  /** duree renseignee dans l'administration, affichee avant le chargement */
  knownDuration?: number | null;
  compact?: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerId = useId();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState<number>(knownDuration ?? 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onOtherPlay = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== playerId) audioRef.current?.pause();
    };
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, [playerId]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setLoading(true);
    try {
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: playerId }));
      await audio.play();
    } catch (playError) {
      // lecture interrompue par une pause : ce n'est pas une erreur
      if (!(playError instanceof DOMException && playError.name === "AbortError")) setError(true);
    } finally {
      setLoading(false);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setCurrent(value);
  }

  function changeVolume(value: number) {
    const audio = audioRef.current;
    setVolume(value);
    setMuted(value === 0);
    if (audio) {
      audio.volume = value;
      audio.muted = value === 0;
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    const next = !muted;
    setMuted(next);
    if (audio) audio.muted = next;
  }

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  if (error) {
    return (
      <div role="alert" className={cn("rounded-2xl border border-orange-300 bg-orange-50 px-5 py-4 text-sm text-orange-900", className)}>
        Cet audio est momentanément indisponible. Réessayez plus tard.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-navy-900 text-ivory-100",
        compact ? "px-3 py-2.5" : "flex-wrap px-5 py-4 sm:flex-nowrap sm:px-6 sm:py-5",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload={compact ? "none" : "metadata"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setDuration(value);
        }}
        onError={() => setError(true)}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={`${playing ? "Mettre en pause" : "Écouter"} : ${title}`}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-950 transition-colors hover:bg-gold-400",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <input
          type="range"
          className="range w-full"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(current, duration || 0)}
          disabled={!duration}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label={`Progression de la lecture : ${title}`}
          aria-valuetext={`${formatDuration(current)} sur ${formatDuration(duration)}`}
          style={
            {
              "--range-progress": `${progress}%`,
              "--range-fill": "var(--color-gold-500)",
              "--range-track": "rgba(248,246,241,0.2)",
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-xs tabular-nums text-ivory-100/70" aria-hidden>
          <span>{formatDuration(current)}</span>
          <span>{loading ? "Chargement…" : duration ? formatDuration(duration) : "--:--"}</span>
        </div>
      </div>

      {compact ? null : (
        <div className="flex w-full items-center gap-2 sm:w-36">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Rétablir le son" : "Couper le son"}
            aria-pressed={muted}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ivory-100/85 hover:bg-ivory-100/10"
          >
            <VolumeIcon muted={muted || volume === 0} className="h-5 w-5" />
          </button>
          <input
            type="range"
            className="range w-full"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            aria-label="Volume"
            style={
              {
                "--range-progress": `${(muted ? 0 : volume) * 100}%`,
                "--range-fill": "var(--color-ivory-100)",
                "--range-track": "rgba(248,246,241,0.2)",
              } as React.CSSProperties
            }
          />
        </div>
      )}
    </div>
  );
}
