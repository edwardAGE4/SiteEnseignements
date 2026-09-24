"use client";

import { forwardRef } from "react";

/**
 * Fenetre modale native (<dialog>) centree a l'ecran.
 * Le centrage est applique en style inline : il ne depend pas de la
 * generation des classes Tailwind (le reset CSS met la marge du <dialog> a 0,
 * ce qui le colle en haut a gauche).
 */
export const Modal = forwardRef<HTMLDialogElement, { title: string; description: string; children: React.ReactNode }>(
  function Modal({ title, description, children }, ref) {
    return (
      <dialog
        ref={ref}
        style={{ position: "fixed", inset: 0, margin: "auto", height: "fit-content" }}
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-0 bg-ivory-50 p-0 shadow-xl backdrop:bg-navy-950/50"
      >
        <div className="p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>
          <p className="mt-2 text-sm text-ink-500">{description}</p>
          <div className="mt-6 flex justify-end gap-3">{children}</div>
        </div>
      </dialog>
    );
  },
);
