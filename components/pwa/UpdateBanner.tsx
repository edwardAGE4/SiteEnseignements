"use client";

import { useId } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { APP_VERSION } from "@/lib/version";
import { format, t } from "@/lib/i18n";
import { mettreAJour, reporter, useUpdateState } from "@/lib/pwa/update";

/**
 * Bandeau « nouvelle version disponible », en bas au centre. La page n'est
 * rechargee que sur « Mettre a jour » ; « Plus tard » le masque jusqu'a la
 * prochaine verification (lib/pwa/update.ts).
 */
export function UpdateBanner() {
  const { available, version } = useUpdateState();
  const textId = useId();

  if (!available) return null;

  const text = version
    ? format(t.update.available, { next: version, current: APP_VERSION })
    : format(t.update.availableUnknown, { current: APP_VERSION });

  return (
    <div
      role="alertdialog"
      aria-labelledby={textId}
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:px-4 sm:pb-0"
    >
      <div className="mx-auto flex max-w-xl animate-fade-up flex-col motion-reduce:animate-none gap-3 rounded-2xl bg-navy-900 p-4 text-ivory-100 shadow-2xl shadow-navy-950/30 sm:flex-row sm:items-center sm:gap-4 sm:pl-6">
        <p id={textId} className="min-w-0 flex-1 text-sm leading-relaxed">
          {text}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={reporter} className={buttonClassName({ variant: "ghost", size: "sm", className: "flex-1 sm:flex-none" })}>
            {t.update.later}
          </button>
          <button type="button" onClick={mettreAJour} className={buttonClassName({ variant: "gold", size: "sm", className: "flex-1 sm:flex-none" })}>
            {t.update.update}
          </button>
        </div>
      </div>
    </div>
  );
}
