"use client";

import { useActionState, useRef } from "react";
import { submitWithoutReset } from "@/lib/form";
import type { UserFormState } from "@/app/admin/(dashboard)/utilisateurs/actions";
import { FormAlerts } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

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
  onSuccess?: (result: UserFormState) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(async (prev: UserFormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (!result?.error) {
      onSuccess?.(result);
      if (mode === "create") formRef.current?.reset();
    }
    return result;
  }, undefined);

  return (
    <form ref={formRef} onSubmit={submitWithoutReset(formAction)} className="space-y-4">
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
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">Rôle</label>
          <select name="role" defaultValue={defaults?.role ?? "EDITOR"} className={inputClass}>
            <option value="EDITOR">Éditeur</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">
            {mode === "create" ? "Mot de passe" : "Nouveau mot de passe (optionnel)"}
          </label>
          <PasswordInput
            name="password"
            required={mode === "create"}
            minLength={8}
            autoComplete="new-password"
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

      <FormAlerts state={state} />

      <ConfirmSubmitButton
        disabled={isPending}
        title={mode === "create" ? "Créer cet utilisateur ?" : "Mettre à jour cet utilisateur ?"}
        description={
          mode === "create"
            ? "Un nouveau compte va être enregistré en base de données."
            : "Les modifications de ce compte vont être enregistrées en base de données."
        }
        className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-60"
      >
        {isPending ? "..." : mode === "create" ? "Créer l'utilisateur" : "Mettre à jour"}
      </ConfirmSubmitButton>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";
