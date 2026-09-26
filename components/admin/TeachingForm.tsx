"use client";

import { useActionState, useState } from "react";
import { slugify } from "@/lib/utils";
import { extractYoutubeId } from "@/lib/media";
import { submitWithoutReset } from "@/lib/form";
import { uploadMedia } from "@/lib/upload";
import { validateImageUpload, validatePdfUpload } from "@/lib/file-validation";
import { MAX_DOCUMENTS } from "@/lib/validations/teaching";
import type { TeachingFormState } from "@/app/admin/(dashboard)/enseignements/actions";
import { Alert, FormAlerts } from "@/components/ui/Alert";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

type Category = { id: string; name: string };

type TeachingDefaults = {
  title: string;
  slug: string;
  description: string;
  youtubeUrl: string;
  spotifyUrl: string;
  documents: DocumentItem[];
  coverImageUrl: string;
  tags: string;
  status: "DRAFT" | "PUBLISHED";
  categoryIds: string[];
};

/** Document PDF du formulaire. `id` absent = envoye mais pas encore enregistre. */
type DocumentItem = { id?: string; url: string; fileName: string };

const EMPTY_DEFAULTS: TeachingDefaults = {
  title: "",
  slug: "",
  description: "",
  youtubeUrl: "",
  spotifyUrl: "",
  documents: [],
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
  initialState,
}: {
  categories: Category[];
  defaults?: TeachingDefaults;
  action: (prevState: TeachingFormState, formData: FormData) => Promise<TeachingFormState>;
  submitLabel?: string;
  initialState?: TeachingFormState;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isCreation = defaults === EMPTY_DEFAULTS;

  const [title, setTitle] = useState(defaults.title);
  const [youtubeUrl, setYoutubeUrl] = useState(defaults.youtubeUrl);
  const youtubeId = youtubeUrl.trim() ? extractYoutubeId(youtubeUrl) : null;
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));

  const [coverImageUrl, setCoverImageUrl] = useState(defaults.coverImageUrl);
  // progression de l'envoi en % (null = aucun envoi en cours)
  const [coverProgress, setCoverProgress] = useState<number | null>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>(defaults.documents);
  // apres un enregistrement, on reprend la liste renvoyee par le serveur (avec les id)
  const [syncedState, setSyncedState] = useState(state);
  if (state !== syncedState) {
    setSyncedState(state);
    if (state?.documents) setDocuments(state.documents);
  }
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  // "2 / 3" pendant l'envoi de plusieurs fichiers
  const [pdfQueueLabel, setPdfQueueLabel] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const coverUploading = coverProgress !== null;
  const pdfUploading = pdfProgress !== null;

  async function handleImageUpload(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    setUploadError(null);

    const sizeError = validateImageUpload(file);
    if (sizeError) {
      setUploadError(sizeError);
      input.value = "";
      return;
    }

    setCoverProgress(0);
    try {
      const data = await uploadMedia("image", file, setCoverProgress);
      setCoverImageUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Échec de l'envoi de l'image.");
      input.value = "";
    } finally {
      setCoverProgress(null);
    }
  }

  async function handlePdfUpload(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;
    setUploadError(null);

    const remaining = MAX_DOCUMENTS - documents.length;
    if (files.length > remaining) {
      setUploadError(`${MAX_DOCUMENTS} documents PDF maximum : vous pouvez encore en ajouter ${remaining}.`);
      return;
    }

    const errors: string[] = [];
    for (const [index, file] of files.entries()) {
      const sizeError = validatePdfUpload(file);
      if (sizeError) {
        errors.push(`${file.name} : ${sizeError} (${(file.size / 1024 / 1024).toFixed(1)} Mo)`);
        continue;
      }

      setPdfQueueLabel(files.length > 1 ? `${index + 1} / ${files.length}` : null);
      setPdfProgress(0);
      try {
        const data = await uploadMedia("pdf", file, setPdfProgress);
        setDocuments((current) => [...current, { url: data.url, fileName: data.fileName }]);
      } catch (error) {
        errors.push(`${file.name} : ${error instanceof Error ? error.message : "échec de l'envoi."}`);
      }
    }

    setPdfProgress(null);
    setPdfQueueLabel(null);
    if (errors.length) setUploadError(errors.join(" — "));
  }

  function updateDocument(index: number, fileName: string) {
    setDocuments((current) => current.map((doc, i) => (i === index ? { ...doc, fileName } : doc)));
  }

  function moveDocument(index: number, offset: -1 | 1) {
    setDocuments((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + offset, 0, moved);
      return next;
    });
  }

  function removeDocument(index: number) {
    setDocuments((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="space-y-8">
      <input type="hidden" name="documents" value={JSON.stringify(documents)} />
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
          <input
            name="youtubeUrl"
            type="url"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={inputClass}
          />
          {youtubeId ? (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
                alt="Aperçu de la vidéo"
                className="h-16 w-28 rounded-lg object-cover"
              />
              <p className="text-xs text-emerald-700">Vidéo reconnue</p>
            </div>
          ) : null}
          {youtubeUrl.trim() && !youtubeId ? (
            <p className="mt-1 text-xs text-orange-700">
              Lien non reconnu : la vidéo ne pourra pas être affichée.
            </p>
          ) : null}
        </Field>
        <Field label="URL Spotify">
          <input name="spotifyUrl" type="url" defaultValue={defaults.spotifyUrl} placeholder="https://open.spotify.com/episode/..." className={inputClass} />
        </Field>
      </div>

      <Field label={`Documents PDF (${documents.length})`} error={state?.fieldErrors?.documents}>
        {documents.length > 0 ? (
          <ul className="mb-3 divide-y divide-ink-900/10 rounded-xl border border-ink-900/10 bg-ivory-50">
            {documents.map((document, index) => (
              <li key={document.url} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span aria-hidden className="font-data text-xs text-ink-300">
                  {index + 1}.
                </span>
                <input
                  value={document.fileName}
                  onChange={(event) => updateDocument(index, event.target.value)}
                  aria-label={`Nom affiché du document ${index + 1}`}
                  required
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-ink-900 hover:border-ink-900/15 focus:border-navy-900 focus:outline-none"
                />
                {document.id ? null : (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">non enregistré</span>
                )}
                <a href={document.url} target="_blank" rel="noreferrer" className="text-xs text-navy-900 underline">
                  Ouvrir
                </a>
                <button
                  type="button"
                  onClick={() => moveDocument(index, -1)}
                  disabled={index === 0}
                  aria-label="Monter"
                  className="px-1 text-ink-500 hover:text-navy-900 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDocument(index, 1)}
                  disabled={index === documents.length - 1}
                  aria-label="Descendre"
                  className="px-1 text-ink-500 hover:text-navy-900 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          type="file"
          accept="application/pdf"
          multiple
          disabled={pdfUploading || documents.length >= MAX_DOCUMENTS}
          onChange={(event) => handlePdfUpload(event.currentTarget)}
          className="block w-full text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory-100"
        />
        <p className="mt-1 text-xs text-ink-300">
          Vous pouvez sélectionner plusieurs fichiers. 20 Mo maximum par fichier, {MAX_DOCUMENTS} documents maximum.
          Les documents retirés ne sont supprimés qu&apos;à l&apos;enregistrement.
        </p>
        {pdfUploading ? <UploadProgress percent={pdfProgress} label={pdfQueueLabel} /> : null}
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Image de couverture">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={coverUploading}
            onChange={(event) => handleImageUpload(event.currentTarget)}
            className="block w-full text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory-100"
          />
          <p className="mt-1 text-xs text-ink-300">JPEG, PNG ou WebP, 8 Mo maximum.</p>
          {coverUploading ? <UploadProgress percent={coverProgress} /> : null}
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="Aperçu" className="mt-2 h-24 w-32 rounded-lg object-cover" />
          ) : null}
        </Field>
      </div>

      {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}

      <Field label="Catégories" error={state?.fieldErrors?.categoryIds}>
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
          {categories.length === 0 ? <p className="text-sm text-ink-300">Créez d&apos;abord une catégorie.</p> : null}
        </div>
      </Field>

      <Field label="Tags (séparés par des virgules)">
        <input name="tags" defaultValue={defaults.tags} placeholder="foi, transformation" className={inputClass} />
      </Field>

      <Field label="Statut">
        <select name="status" defaultValue={defaults.status} className={inputClass}>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </Field>

      <FormAlerts state={state} />

      <ConfirmSubmitButton
        disabled={isPending || coverUploading || pdfUploading}
        title={isCreation ? "Créer cet enseignement ?" : "Enregistrer les modifications ?"}
        description={
          isCreation
            ? "Le nouvel enseignement va être enregistré en base de données."
            : "Les modifications de cet enseignement vont être enregistrées en base de données."
        }
        className="rounded-full bg-navy-900 px-6 py-3 font-accent text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-60"
      >
        {isPending ? "Enregistrement..." : submitLabel}
      </ConfirmSubmitButton>
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

function UploadProgress({ percent, label }: { percent: number | null; label?: string | null }) {
  const value = percent ?? 0;
  return (
    <div className="mt-2 space-y-1" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10">
        <div className="h-full rounded-full bg-navy-900 transition-all" style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-ink-500">
        {label ? `Fichier ${label} — ` : ""}
        {value < 100 ? `Envoi en cours... ${value} %` : "Traitement du fichier..."}
      </p>
    </div>
  );
}
