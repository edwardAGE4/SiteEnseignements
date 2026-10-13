"use client";

import { useActionState, useRef, useState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { slugify } from "@/lib/utils";
import { uploadMedia } from "@/lib/upload";
import { validateUpload } from "@/lib/file-validation";
import type { CategoryFormState } from "@/app/admin/(dashboard)/categories/actions";
import { Alert, FormAlerts } from "@/components/ui/Alert";

type CategoryDefaults = { name: string; slug: string; description: string; imageUrl: string; isActive: boolean };

export function CategoryForm({
  action,
  defaults,
  submitLabel = "Enregistrer",
  onSuccess,
}: {
  action: (prevState: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  defaults?: CategoryDefaults;
  submitLabel?: string;
  onSuccess?: (result: CategoryFormState) => void;
}) {
  const [name, setName] = useState(defaults?.name ?? "");
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults?.slug));
  const [imageUrl, setImageUrl] = useState(defaults?.imageUrl ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(async (prev: CategoryFormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (!result?.error) {
      onSuccess?.(result);
      if (!defaults) {
        setName("");
        setSlug("");
        setSlugTouched(false);
        setImageUrl("");
        formRef.current?.reset();
      }
    }
    return result;
  }, undefined);

  async function handleImage(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadError(null);
    const error = validateUpload("image", file);
    if (error) {
      setUploadError(error);
      return;
    }
    setProgress(0);
    try {
      const data = await uploadMedia("image", file, setProgress);
      setImageUrl(data.url);
    } catch (uploadFailure) {
      setUploadError(uploadFailure instanceof Error ? uploadFailure.message : "Échec de l'envoi de l'image.");
    } finally {
      setProgress(null);
    }
  }

  const idPrefix = defaults ? `cat-${defaults.slug}` : "cat-new";

  return (
    <form ref={formRef} onSubmit={submitWithoutReset(formAction, () => !isPending && progress === null)} className="space-y-4">
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-name`} className={labelClass}>
            Nom
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={inputClass}
          />
          {state?.fieldErrors?.name ? <p className="text-xs text-red-700">{state.fieldErrors.name}</p> : null}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-slug`} className={labelClass}>
            Slug
          </label>
          <input
            id={`${idPrefix}-slug`}
            name="slug"
            required
            minLength={2}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            className={inputClass}
          />
          {state?.fieldErrors?.slug ? <p className="text-xs text-red-700">{state.fieldErrors.slug}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
          Description
        </label>
        <textarea id={`${idPrefix}-description`} name="description" rows={2} maxLength={500} defaultValue={defaults?.description} className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <span className={labelClass}>Image (facultative)</span>
        <div className="flex flex-wrap items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Aperçu" className="h-14 w-24 rounded-lg object-cover" />
          ) : null}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={progress !== null}
            onChange={(event) => handleImage(event.currentTarget)}
            aria-label="Image de la catégorie"
            className="block text-sm text-ink-500 file:mr-3 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:text-ivory-100"
          />
          {imageUrl ? (
            <button type="button" onClick={() => setImageUrl("")} className="text-xs font-medium text-red-700 hover:underline">
              Retirer
            </button>
          ) : null}
        </div>
        {progress !== null ? <p className="text-xs text-ink-500">Envoi en cours… {progress} %</p> : null}
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-900">
        <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} className="h-4 w-4 accent-navy-900" />
        Catégorie active (affichée sur le site)
      </label>

      {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}
      <FormAlerts state={state} />

      <button
        type="submit"
        disabled={isPending || progress !== null}
        className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-700 disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}

const labelClass = "font-data text-xs font-medium uppercase tracking-wide text-ink-700";
const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";
