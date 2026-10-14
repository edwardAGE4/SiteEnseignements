"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { DownloadIcon } from "@/components/ui/Icons";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const noSubscribe = () => () => {};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * « Installer l'application » (mobile uniquement). Android/Chrome : ouvre la
 * fenêtre d'installation native (`beforeinstallprompt`). iOS/Safari n'expose
 * pas cette API : on affiche la marche à suivre (Partager → Sur l'écran
 * d'accueil). Masqué si le site est déjà ouvert en tant qu'application.
 */
export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  // Lus côté navigateur uniquement ; au rendu serveur, le bouton est masqué.
  const isIos = useSyncExternalStore(noSubscribe, () => /iphone|ipad|ipod/i.test(navigator.userAgent), () => false);
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => true);
  const [justInstalled, setJustInstalled] = useState(false);
  const installed = standalone || justInstalled;
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setJustInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!promptEvent && !isIos)) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    } else {
      setShowIosHelp((value) => !value);
    }
  }

  return (
    <div className="md:hidden">
      <button type="button" onClick={install} className={buttonClassName({ variant: "outline", className: "w-full" })}>
        <DownloadIcon className="h-4 w-4" />
        Installer l&apos;application
      </button>
      {showIosHelp ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          Sur iPhone : touchez le bouton <strong>Partager</strong> de Safari, puis{" "}
          <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
        </p>
      ) : null}
    </div>
  );
}
