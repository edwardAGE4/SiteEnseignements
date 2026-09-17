"use client";

import { useActionState } from "react";
import type { UserFormState } from "@/app/admin/(dashboard)/utilisateurs/actions";

type Mode = "create" | "edit";

export function UserForm({
  mode,
  action,
  defaults,
  onSuccess,
}: {
  mode: Mode;
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
  defaults?: { name: string; email?: string; role: "ADMIN" | "EDITOR"; isActive?: boolean };
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(async (prev: UserFormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (!result?.error) onSuccess?.();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">Nom</label>
          <input name="name" required defaultValue={defaults?.name} className={inputClass} />
          {state?.fieldErrors?.name ? <p className="text-xs text-red-600">{state.fieldErrors.name}</p> : null}
        </div>

        {mode === "create" ? (
          <div className="space-y-1.5">
            <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">E-mail</label>
            <input name="email" type="email" required className={inputClass} />
            {state?.fieldErrors?.email ? <p className="text-xs text-red-600">{state.fieldErrors.email}</p> : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">E-mail</label>
            <p className="rounded-xl border border-ink-900/10 bg-ink-900/5 px-4 py-2.5 text-sm text-ink-500">
              {defaults?.email}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">Role</label>
          <select name="role" defaultValue={defaults?.role ?? "EDITOR"} className={inputClass}>
            <option value="EDITOR">Editeur</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">
            {mode === "create" ? "Mot de passe" : "Nouveau mot de passe (optionnel)"}
          </label>
          <input
            name="password"
            type="password"
            required={mode === "create"}
            minLength={8}
            className={inputClass}
          />
          {state?.fieldErrors?.password ? <p className="text-xs text-red-600">{state.fieldErrors.password}</p> : null}
        </div>
      </div>

      {mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} />
          Compte actif
        </label>
      ) : null}

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-60"
      >
        {isPending ? "..." : mode === "create" ? "Creer l'utilisateur" : "Mettre a jour"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";
