"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/admin/connexion/actions";
import { submitWithoutReset } from "@/lib/form";
import { Alert } from "@/components/ui/Alert";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-3 text-sm text-ink-900 focus:border-navy-900 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">
          Mot de passe
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-3 text-sm text-ink-900 focus:border-navy-900 focus:outline-none"
        />
      </div>

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-navy-900 px-6 py-3 font-accent text-sm font-medium text-ivory-100 transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        {isPending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
