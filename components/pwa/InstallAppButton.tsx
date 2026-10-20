"use client";

import { DownloadIcon } from "@/components/ui/Icons";
import { t } from "@/lib/i18n";
import { requestInstall, useInstallState } from "@/lib/pwa/install";

/**
 * Bouton « Installer l'application », visible tant que l'application n'est pas
 * installee. Ouvre la fenetre native du navigateur si elle existe, sinon la
 * popup d'explications (lib/pwa/install.ts). Le style est fourni par l'appelant.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const { installed } = useInstallState();
  if (installed) return null;

  return (
    <button type="button" onClick={() => void requestInstall()} className={className}>
      <DownloadIcon className="h-4 w-4 shrink-0" />
      {t.install.button}
    </button>
  );
}
