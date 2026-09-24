"use client";

import { useRef, useTransition } from "react";
import { Modal } from "@/components/admin/Modal";

export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel = "Confirmer",
  action,
  triggerClassName,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  action: () => Promise<void>;
  triggerClassName?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={triggerClassName ?? "font-data text-xs font-medium text-red-600 hover:underline"}
      >
        {triggerLabel}
      </button>

      <Modal ref={dialogRef} title={title} description={description}>
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
            startTransition(async () => {
              await action();
              dialogRef.current?.close();
            });
          }}
          className="rounded-full bg-red-600 px-4 py-2 font-data text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "..." : confirmLabel}
        </button>
      </Modal>
    </>
  );
}
