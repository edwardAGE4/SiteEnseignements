"use client";

import { useId } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { CloseIcon, ShareIcon } from "@/components/ui/Icons";
import { format, t } from "@/lib/i18n";
import { postponeInstall, promptInstall, useInstallState, type InstallPlatform } from "@/lib/pwa/install";

/** Etape iOS : remplace {share} par l'icone du bouton Partager. */
function Step({ text }: { text: string }) {
  const [before, after] = text.split("{share}");
  return (
    <>
      {before}
      {after !== undefined ? (
        <>
          <ShareIcon className="mx-0.5 inline h-4 w-4 align-[-2px] text-navy-900" />
          <span className="sr-only">(icône carré et flèche vers le haut)</span>
          {after}
        </>
      ) : null}
    </>
  );
}

function Instructions({ platform }: { platform: InstallPlatform }) {
  if (platform === "ios-safari" || platform === "ios-other") {
    const steps = platform === "ios-safari" ? t.install.iosSafariSteps : t.install.iosOtherSteps;
    return (
      <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-ivory-100">
              {index + 1}
            </span>
            <span>
              <Step text={step} />
            </span>
          </li>
        ))}
      </ol>
    );
  }
  const text = platform === "ios-inapp" ? format(t.install.iosInApp) : t.install.otherBrowser;
  return <p className="mt-3 text-sm leading-relaxed text-ink-700">{text}</p>;
}

/**
 * Popup d'installation en bas de l'ecran, ouverte automatiquement (Chrome /
 * Edge des que le navigateur le permet, iOS apres quelques secondes) ou par
 * un bouton « Installer l'application ». Etat et regles : lib/pwa/install.ts.
 */
export function InstallPrompt() {
  const { popupOpen, installed, canPrompt, platform } = useInstallState();
  const titleId = useId();
  const textId = useId();

  if (!popupOpen || installed) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={textId}
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4"
    >
      <div className="relative mx-auto max-w-md animate-fade-up rounded-2xl motion-reduce:animate-none border border-ink-900/10 bg-ivory-50 p-5 shadow-2xl shadow-navy-950/20">
        <button
          type="button"
          onClick={postponeInstall}
          aria-label={t.install.close}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-900/5 hover:text-navy-900"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- petite icone statique */}
          <img src="/icons/icon-96.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-base font-semibold text-navy-900">
              {format(t.install.title)}
            </h2>
            <div id={textId}>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{format(t.install.intro)}</p>
              {canPrompt ? null : <Instructions platform={platform} />}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          {canPrompt ? (
            <>
              <button
                type="button"
                onClick={postponeInstall}
                className={buttonClassName({ variant: "outline", size: "sm", className: "flex-1" })}
              >
                {t.install.later}
              </button>
              <button
                type="button"
                onClick={() => void promptInstall()}
                className={buttonClassName({ size: "sm", className: "flex-1" })}
              >
                {t.install.install}
              </button>
            </>
          ) : (
            <button type="button" onClick={postponeInstall} className={buttonClassName({ size: "sm", className: "flex-1" })}>
              {t.install.understood}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
