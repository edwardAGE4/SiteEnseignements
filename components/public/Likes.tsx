"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LikesState = { counts: Record<string, number>; liked: string[] };

const LikesContext = createContext<{
  state: LikesState;
  toggle: (target: string) => void;
} | null>(null);

/**
 * Charge une seule fois les "j'aime" de l'enseignement pour tous les boutons de
 * la page (video, audio, chaque PDF). Charge cote client pour que la page
 * reste en cache statique.
 */
export function LikesProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [state, setState] = useState<LikesState>({ counts: {}, liked: [] });
  const endpoint = `/api/enseignements/${slug}/likes`;

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LikesState | null) => {
        if (data && !cancelled) setState(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  function toggle(target: string) {
    const wasLiked = state.liked.includes(target);
    const previous = state;

    // mise à jour immediate, corrigee par la reponse du serveur
    setState((current) => ({
      counts: { ...current.counts, [target]: Math.max(0, (current.counts[target] ?? 0) + (wasLiked ? -1 : 1)) },
      liked: wasLiked ? current.liked.filter((item) => item !== target) : [...current.liked, target],
    }));

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { liked: boolean; count: number }) => {
        setState((current) => ({
          counts: { ...current.counts, [target]: data.count },
          liked: data.liked
            ? Array.from(new Set([...current.liked, target]))
            : current.liked.filter((item) => item !== target),
        }));
      })
      .catch(() => setState(previous));
  }

  return <LikesContext.Provider value={{ state, toggle }}>{children}</LikesContext.Provider>;
}

export function LikeButton({ target, label, className }: { target: string; label: string; className?: string }) {
  const context = useContext(LikesContext);
  if (!context) return null;

  const liked = context.state.liked.includes(target);
  const count = context.state.counts[target] ?? 0;

  return (
    <button
      type="button"
      onClick={() => context.toggle(target)}
      aria-pressed={liked}
      aria-label={`${liked ? "Retirer mon j'aime" : "J'aime"} : ${label} (${count})`}
      title={liked ? "Retirer mon j'aime" : "J'aime"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 font-data text-sm transition-colors",
        liked
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-ink-900/15 text-ink-700 hover:border-red-300 hover:text-red-600",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.49-2.1-4.5-4.69-4.5-1.93 0-3.6 1.13-4.31 2.73-.72-1.6-2.38-2.73-4.31-2.73C5.1 3.75 3 5.76 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
