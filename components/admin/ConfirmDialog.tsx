"use client";

import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/admin/Modal";
import { Alert } from "@/components/ui/Alert";

type Result = { error?: string; success?: string } | void;

/**
 * Bouton + fenetre de confirmation. La fenetre ne se ferme qu'apres la reussite
 * de l'action ; en cas d'echec, le message d'erreur y est affiche.
 */
export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel = "Confirmer",
  action,
  triggerClassName,
  tone = "danger",
  onDone,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  action: () => Promise<Result>;
  triggerClassName?: string;
  tone?: "danger" | "neutral";
  onDone?: (result: Result) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        className={triggerClassName ?? "font-data text-xs font-medium text-red-700 hover:underline"}
      >
        {triggerLabel}
      </button>

      <Modal ref={dialogRef} title={title} description={description}>
        {error ? (
          <Alert variant="error" className="w-full">
            {error}
          </Alert>
        ) : null}
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-full border border-ink-900/15 px-4 py-2 font-data text-sm text-ink-700"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await action();
                if (result && result.error) {
                  setError(result.error);
                  return;
                }
                dialogRef.current?.close();
                onDone?.(result);
              } catch {
                setError("Une erreur réseau ou serveur est survenue. Réessayez.");
              }
            });
          }}
          className={
            tone === "danger"
              ? "rounded-full bg-red-700 px-4 py-2 font-data text-sm font-medium text-white disabled:opacity-60"
              : "rounded-full bg-navy-900 px-4 py-2 font-data text-sm font-medium text-ivory-100 disabled:opacity-60"
          }
        >
          {isPending ? "Traitement…" : confirmLabel}
        </button>
      </Modal>
    </>
  );
}
