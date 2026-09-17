"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export function TeachingRowActions({
  id,
  status,
  onTogglePublish,
  onDelete,
}: {
  id: string;
  status: "PUBLISHED" | "DRAFT";
  onTogglePublish: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-4">
      <Link href={`/admin/enseignements/${id}/modifier`} className="font-data text-xs font-medium text-navy-900 hover:underline">
        Modifier
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => onTogglePublish(id))}
        className="font-data text-xs font-medium text-navy-900 hover:underline disabled:opacity-50"
      >
        {status === "PUBLISHED" ? "Depublier" : "Publier"}
      </button>
      <ConfirmDialog
        triggerLabel="Supprimer"
        title="Supprimer cet enseignement ?"
        description="Cette action est irreversible. L'enseignement et ses fichiers associes seront definitivement supprimes."
        confirmLabel="Supprimer"
        action={() => onDelete(id)}
      />
    </div>
  );
}
