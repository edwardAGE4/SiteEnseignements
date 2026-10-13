"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { SOCIAL_NETWORKS, type SocialKey } from "@/lib/social";
import { saveIdentity } from "@/app/admin/(dashboard)/parametres/actions";
import { FormAlerts } from "@/components/ui/Alert";

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";

/** Presentation courte et liens vers les reseaux sociaux (pied de page). */
export function IdentitySettingsForm({ intro, socials }: { intro: string; socials: Record<SocialKey, string> }) {
  const [state, formAction, isPending] = useActionState(saveIdentity, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={submitWithoutReset(formAction, () => !isPending)} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="siteIntro" className="font-data text-xs font-medium uppercase tracking-wide text-ink-700">
          Courte présentation (pied de page)
        </label>
        <textarea id="siteIntro" name="siteIntro" rows={3} maxLength={400} defaultValue={intro} className={inputClass} />
        <p className="text-xs text-ink-500">Facultatif. Vide = non affichée.</p>
        {errors.siteIntro ? <p className="text-xs text-red-700">{errors.siteIntro}</p> : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="font-data text-xs font-medium uppercase tracking-wide text-ink-700">Réseaux sociaux</legend>
        <p className="text-xs text-ink-500">Seuls les réseaux renseignés apparaissent sur le site. Indiquez l&apos;adresse complète de la page.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <div key={network.key} className="space-y-1">
              <label htmlFor={network.key} className="text-sm font-medium text-ink-900">
                {network.label}
              </label>
              <input
                id={network.key}
                name={network.key}
                type="url"
                defaultValue={socials[network.key]}
                placeholder={`https://${network.hosts[0]}/…`}
                className={inputClass}
              />
              {errors[network.key] ? <p className="text-xs text-red-700">{errors[network.key]}</p> : null}
            </div>
          ))}
        </div>
      </fieldset>

      <FormAlerts state={state} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-700 disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
