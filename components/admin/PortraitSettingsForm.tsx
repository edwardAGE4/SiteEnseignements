"use client";

import { useActionState, useState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { uploadWithProgress } from "@/lib/upload";
import { validateImageUpload } from "@/lib/file-validation";
import {
  removePastorPortrait,
  savePastorPortrait,
} from "@/app/admin/(dashboard)/parametres/actions";
import { Alert, FormAlerts } from "@/components/ui/Alert";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export function PortraitSettingsForm({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(savePastorPortrait, undefined);
  // photo envoyee mais pas encore validee
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [syncedState, setSyncedState] = useState(state);
  if (state !== syncedState) {
    setSyncedState(state);
    if (state?.success) setPendingUrl(null);
  }

  const displayedUrl = pendingUrl ?? currentUrl;

  async function handleUpload(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadError(null);

    const sizeError = validateImageUpload(file);
    if (sizeError) {
      setUploadError(sizeError);
      return;
    }

    setProgress(0);
    try {
      const data = await uploadWithProgress<{ url: string }>("/api/upload/image", file, setProgress);
      setPendingUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Echec de l'envoi de la photo.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-navy-900">
        {displayedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayedUrl} alt="Photo du Pasteur Jean-Marc GNALI" className="h-full w-full object-cover object-[center_25%]" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center font-accent text-xs uppercase tracking-[0.2em] text-ivory-100/50">
            Aucune photo
          </div>
        )}
      </div>

      <form onSubmit={submitWithoutReset(formAction)} className="space-y-4">
        <input type="hidden" name="portraitUrl" value={pendingUrl ?? ""} />

        <div className="space-y-1.5">
          <label htmlFor="portrait" className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">
            {currentUrl ? "Remplacer la photo" : "Choisir une photo"}
          </label>
          <input
            id="portrait"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={progress !== null}
            onChange={(event) => handleUpload(event.currentTarget)}
            className="block w-full text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory-100"
          />
          <p className="text-xs text-ink-300">JPEG, PNG ou WebP, 8 Mo maximum.</p>
          {progress !== null ? <p className="text-xs text-ink-500">Envoi en cours... {progress} %</p> : null}
        </div>

        {pendingUrl ? (
          <Alert variant="warning">Apercu : cliquez sur « Publier la photo » pour l&apos;afficher sur le site.</Alert>
        ) : null}
        {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}
        <FormAlerts state={state} />

        <div className="flex flex-wrap items-center gap-4">
          <ConfirmSubmitButton
            disabled={!pendingUrl || isPending || progress !== null}
            title="Publier cette photo ?"
            description="Elle remplacera la photo actuelle sur la page d'accueil et la page A propos."
            className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-40"
          >
            {isPending ? "Publication..." : "Publier la photo"}
          </ConfirmSubmitButton>

          {pendingUrl ? (
            <button
              type="button"
              onClick={() => setPendingUrl(null)}
              className="font-data text-sm text-ink-500 hover:underline"
            >
              Annuler
            </button>
          ) : null}

          {currentUrl && !pendingUrl ? (
            <ConfirmDialog
              triggerLabel="Retirer la photo"
              title="Retirer la photo du pasteur ?"
              description="L'emplacement reserve sera affiche a la place sur le site."
              confirmLabel="Retirer"
              action={removePastorPortrait}
              triggerClassName="font-data text-sm font-medium text-red-600 hover:underline"
            />
          ) : null}
        </div>
      </form>
    </div>
  );
}

