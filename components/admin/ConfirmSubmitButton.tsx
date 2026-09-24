"use client";

import { useRef } from "react";
import { Modal } from "@/components/admin/Modal";

/**
 * Bouton d'envoi qui demande une confirmation avant de soumettre le formulaire
 * parent. La validation native du navigateur est verifiee avant d'ouvrir la popup.
 */
export function ConfirmSubmitButton({
  children,
  title = "Confirmer l'enregistrement ?",
  description = "Les informations saisies vont etre enregistrees en base de donnees.",
  confirmLabel = "Confirmer",
  disabled,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          const form = buttonRef.current?.form;
          if (!form || !form.reportValidity()) return;
          dialogRef.current?.showModal();
        }}
        className={className}
      >
        {children}
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
          autoFocus
          onClick={() => {
            dialogRef.current?.close();
            buttonRef.current?.form?.requestSubmit();
          }}
          className="rounded-full bg-navy-900 px-4 py-2 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800"
        >
          {confirmLabel}
        </button>
      </Modal>
    </>
  );
}
