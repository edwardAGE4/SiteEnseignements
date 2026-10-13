"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteTeaching, setTeachingStatus, type ActionResult } from "@/app/admin/(dashboard)/enseignements/actions";

type Status = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export function TeachingRowActions({
  id,
  status,
  publicPath,
  onResult,
}: {
  id: string;
  status: Status;
  publicPath: string;
  onResult: (result: ActionResult | undefined) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function changeStatus(next: Status) {
    startTransition(async () => {
      try {
        onResult(await setTeachingStatus(id, next));
      } catch {
        onResult({ error: "Erreur réseau : le statut n'a pas été modifié." });
      }
    });
  }

  const linkClass = "font-data text-xs font-medium text-navy-900 hover:underline disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-4">
      <Link href={`/admin/enseignements/${id}/modifier`} className={linkClass}>
        Modifier
      </Link>
      {status === "PUBLISHED" ? (
        <a href={publicPath} target="_blank" rel="noreferrer" className={linkClass}>
          Voir
        </a>
      ) : (
        <Link href={`/admin/enseignements/${id}/apercu`} className={linkClass}>
          Aperçu
        </Link>
      )}
      <button type="button" disabled={isPending} onClick={() => changeStatus(status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")} className={linkClass}>
        {status === "PUBLISHED" ? "Dépublier" : "Publier"}
      </button>
      {status !== "ARCHIVED" ? (
        <button type="button" disabled={isPending} onClick={() => changeStatus("ARCHIVED")} className={linkClass}>
          Archiver
        </button>
      ) : null}
      <ConfirmDialog
        triggerLabel="Supprimer"
        title="Supprimer cette ressource ?"
        description="Cette action est irréversible : la ressource et ses fichiers seront définitivement supprimés. Pour la retirer du site sans la perdre, préférez « Archiver »."
        confirmLabel="Supprimer définitivement"
        action={() => deleteTeaching(id)}
        onDone={(result) => onResult(result ?? undefined)}
      />
    </div>
  );
}
