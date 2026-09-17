"use client";

import { useActionState, useState } from "react";
import { slugify } from "@/lib/utils";
import type { TeachingFormState } from "@/app/admin/(dashboard)/enseignements/actions";

type Category = { id: string; name: string };

type TeachingDefaults = {
  title: string;
  slug: string;
  description: string;
  youtubeUrl: string;
  spotifyUrl: string;
  pdfUrl: string;
  pdfFileName: string;
  coverImageUrl: string;
  tags: string;
  status: "DRAFT" | "PUBLISHED";
  categoryIds: string[];
};

const EMPTY_DEFAULTS: TeachingDefaults = {
  title: "",
  slug: "",
  description: "",
  youtubeUrl: "",
  spotifyUrl: "",
  pdfUrl: "",
  pdfFileName: "",
  coverImageUrl: "",
  tags: "",
  status: "DRAFT",
  categoryIds: [],
};

export function TeachingForm({
  categories,
  defaults = EMPTY_DEFAULTS,
  action,
  submitLabel = "Enregistrer",
}: {
  categories: Category[];
  defaults?: TeachingDefaults;
  action: (prevState: TeachingFormState, formData: FormData) => Promise<TeachingFormState>;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));

  const [coverImageUrl, setCoverImageUrl] = useState(defaults.coverImageUrl);
  const [coverUploading, setCoverUploading] = useState(false);

  const [pdfUrl, setPdfUrl] = useState(defaults.pdfUrl);
  const [pdfFileName, setPdfFileName] = useState(defaults.pdfFileName);
  const [pdfUploading, setPdfUploading] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleImageUpload(file: File) {
    setCoverUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverImageUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Echec de l'envoi de l'image.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handlePdfUpload(file: File) {
    setPdfUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPdfUrl(data.url);
      setPdfFileName(data.fileName);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Echec de l'envoi du PDF.");
    } finally {
      setPdfUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="pdfUrl" value={pdfUrl} />
      <input type="hidden" name="pdfFileName" value={pdfFileName} />
      <input type="hidden" name="coverImageUrl" value={coverImageUrl} />

      <Field label="Titre" error={state?.fieldErrors?.title}>
        <input
          name="title"
          required
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          className={inputClass}
        />
      </Field>

      <Field label="Slug (URL)" error={state?.fieldErrors?.slug}>
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
      </Field>

      <Field label="Description" error={state?.fieldErrors?.description}>
        <textarea name="description" required rows={5} defaultValue={defaults.description} className={inputClass} />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="URL YouTube" error={state?.fieldErrors?.youtubeUrl}>
          <input name="youtubeUrl" type="url" defaultValue={defaults.youtubeUrl} placeholder="https://www.youtube.com/watch?v=..." className={inputClass} />
        </Field>
        <Field label="URL Spotify">
          <input name="spotifyUrl" type="url" defaultValue={defaults.spotifyUrl} placeholder="https://open.spotify.com/episode/..." className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Document PDF">
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handlePdfUpload(file);
            }}
            className="block w-full text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory-100"
          />
          {pdfUploading ? <p className="mt-1 text-xs text-ink-300">Envoi en cours...</p> : null}
          {pdfFileName ? <p className="mt-1 text-xs text-emerald-700">Fichier : {pdfFileName}</p> : null}
        </Field>

        <Field label="Image de couverture">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            className="block w-full text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory-100"
          />
          {coverUploading ? <p className="mt-1 text-xs text-ink-300">Envoi en cours...</p> : null}
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="Apercu" className="mt-2 h-24 w-32 rounded-lg object-cover" />
          ) : null}
        </Field>
      </div>

      {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}

      <Field label="Categories" error={state?.fieldErrors?.categoryIds}>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 rounded-full border border-ink-900/15 px-4 py-2 text-sm has-[:checked]:border-navy-900 has-[:checked]:bg-navy-900 has-[:checked]:text-ivory-100">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={defaults.categoryIds.includes(category.id)}
                className="hidden"
              />
              {category.name}
            </label>
          ))}
          {categories.length === 0 ? <p className="text-sm text-ink-300">Creez d&apos;abord une categorie.</p> : null}
        </div>
      </Field>

      <Field label="Tags (separes par des virgules)">
        <input name="tags" defaultValue={defaults.tags} placeholder="foi, transformation" className={inputClass} />
      </Field>

      <Field label="Statut">
        <select name="status" defaultValue={defaults.status} className={inputClass}>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publie</option>
        </select>
      </Field>

      {state?.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || coverUploading || pdfUploading}
        className="rounded-full bg-navy-900 px-6 py-3 font-accent text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-60"
      >
        {isPending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-3 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
