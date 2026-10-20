"use client";

import { buttonClassName } from "@/components/ui/Button";
import { InstallAppButton as InstallButton } from "@/components/pwa/InstallAppButton";

/**
 * « Installer l'application » de la page d'accueil (mobile uniquement).
 * La logique (fenetre native, explications iOS, deja installe) est partagee
 * avec la popup : voir lib/pwa/install.ts.
 */
export function InstallAppButton() {
  return (
    <div className="md:hidden">
      <InstallButton className={buttonClassName({ variant: "outline", className: "w-full" })} />
    </div>
  );
}
