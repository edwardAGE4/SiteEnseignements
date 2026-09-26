"use client";

import { useActionState, useRef, useState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { slugify } from "@/lib/utils";
import type { CategoryFormState } from "@/app/admin/(dashboard)/categories/actions";
import { FormAlerts } from "@/components/ui/Alert";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export function CategoryForm({
  action,
  defaults,
  submitLabel = "Enregistrer",
  onSuccess,
}: {
  action: (prevState: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  defaults?: { name: string; slug: string; description: string };
  submitLabel?: string;
  onSuccess?: (result: CategoryFormState) => void;
}) {
  const [name, setName] = useState(defaults?.name ?? "");
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults?.slug));

  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(async (prev: CategoryFormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (!result?.error) {
      onSuccess?.(result);
      if (!defaults) {
        setName("");
        setSlug("");
        setSlugTouched(false);
        formRef.current?.reset();
      }
    }
    return result;
  }, undefined);

  return (
    <form ref={formRef} onSubmit={submitWithoutReset(formAction)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">Nom</label>
          <input
            name="name"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={inputClass}
          />
          {state?.fieldErrors?.name ? <p className="text-xs text-red-600">{state.fieldErrors.name}</p> : null}
        </div>
        <div className="space-y-1.5">
          <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">Slug</label>
          <input
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            className={inputClass}
          />
          {state?.fieldErrors?.slug ? <p className="text-xs text-red-600">{state.fieldErrors.slug}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">Description</label>
        <textarea name="description" rows={2} defaultValue={defaults?.description} className={inputClass} />
      </div>

      <FormAlerts state={state} />

      <ConfirmSubmitButton
        disabled={isPending}
        title={defaults ? "Mettre à jour cette catégorie ?" : "Créer cette catégorie ?"}
        description={
          defaults
            ? "Les modifications de cette catégorie vont être enregistrées en base de données."
            : "La nouvelle catégorie va être enregistrée en base de données."
        }
        className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-60"
      >
        {isPending ? "..." : submitLabel}
      </ConfirmSubmitButton>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";
