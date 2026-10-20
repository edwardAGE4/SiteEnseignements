"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import { useUpdateState, verifier } from "@/lib/pwa/update";

/**
 * « Rechercher une mise a jour » (page À propos). Affiche seulement si le
 * service worker est actif ; la nouvelle version est ensuite proposee par le bandeau.
 */
export function CheckUpdateButton() {
  const { enabled } = useUpdateState();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  if (!enabled) return null;

  async function check() {
    setPending(true);
    setMessage("");
    try {
      setMessage((await verifier()) ? t.about.updateFound : t.about.upToDate);
    } catch {
      setMessage(t.about.checkFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={check} disabled={pending}>
        {pending ? t.about.checking : t.about.checkUpdate}
      </Button>
      <p role="status" className="min-h-5 text-center text-sm text-ink-500">
        {message}
      </p>
    </div>
  );
}
