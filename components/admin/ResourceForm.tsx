"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ResourceType } from "@/generated/prisma/enums";
import { cn, slugify } from "@/lib/utils";
import { formatDuration, formatFileSize, parseSpotifyUrl, parseVideoUrl, VIDEO_PROVIDER_LABELS } from "@/lib/media";
import { submitWithoutReset } from "@/lib/form";
import { uploadMedia } from "@/lib/upload";
import { mimeTypeFor, UPLOAD_RULES, validateUpload, type UploadKindName } from "@/lib/file-validation";
import {
  BOOK_FORMATS,
  fieldErrorsOf,
  MAX_DOCUMENTS,
  teachingInputFromFormData,
  teachingSchema,
} from "@/lib/validations/teaching";
import { SECTIONS, TYPE_TO_SECTION } from "@/lib/sections";
import type { TeachingFormState } from "@/app/admin/(dashboard)/enseignements/actions";
import { Alert, FormAlerts } from "@/components/ui/Alert";
import { TypeIcon } from "@/components/ui/Icons";

type Category = { id: string; name: string; isActive?: boolean };

import type { ResourceDefaults } from "@/lib/resource-defaults";

type DocumentItem = ResourceDefaults["documents"][number];

const TYPE_OPTIONS: { value: ResourceType; label: string; hint: string }[] = [
  { value: "AUDIO", label: "Audio", hint: "Fichier audio ou Spotify" },
  { value: "VIDEO", label: "Vidéo", hint: "YouTube ou Vimeo" },
  { value: "BOOK", label: "Livre", hint: "Couverture, liens, versions" },
  { value: "FILE", label: "Fichier pratique", hint: "PDF, Word, Excel…" },
];

const IMAGE_LABELS: Record<ResourceType, string> = {
  AUDIO: "Miniature",
  VIDEO: "Miniature (facultative pour YouTube, dont la miniature est reprise automatiquement)",
  BOOK: "Couverture du livre",
  FILE: "Image (facultative)",
};

const DOCUMENT_LABELS: Record<ResourceType, string> = {
  AUDIO: "Documents d'accompagnement (facultatif)",
  VIDEO: "Documents d'accompagnement (facultatif)",
  BOOK: "Versions numériques téléchargeables (facultatif)",
  FILE: "Fichiers",
};

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-navy-900 focus:outline-none aria-[invalid=true]:border-red-600";

const fileInputClass =
  "block w-full text-sm text-ink-500 file:mr-4 file:rounded-full file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ivory-100 disabled:opacity-60";

/** Lit la duree d'un fichier audio dans le navigateur (avant envoi). */
function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

export function ResourceForm({
  categories,
  defaults,
  action,
  isCreation,
  initialState,
}: {
  categories: Category[];
  defaults: ResourceDefaults;
  action: (prevState: TeachingFormState, formData: FormData) => Promise<TeachingFormState>;
  isCreation: boolean;
  initialState?: TeachingFormState;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [type, setType] = useState<ResourceType>(defaults.type);
  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));
  const [excerpt, setExcerpt] = useState(defaults.excerpt);
  const [videoUrl, setVideoUrl] = useState(defaults.videoUrl);
  const [spotifyUrl, setSpotifyUrl] = useState(defaults.spotifyUrl);
  const [audioUrl, setAudioUrl] = useState(defaults.audioUrl);
  const [duration, setDuration] = useState(defaults.duration);
  const [coverImageUrl, setCoverImageUrl] = useState(defaults.coverImageUrl);
  const [seoTitle, setSeoTitle] = useState(defaults.seoTitle);
  const [seoDescription, setSeoDescription] = useState(defaults.seoDescription);
  const [documents, setDocuments] = useState<DocumentItem[]>(defaults.documents);

  // progression des envois en % (null = aucun envoi en cours)
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const [docProgress, setDocProgress] = useState<number | null>(null);
  const [docQueueLabel, setDocQueueLabel] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // erreurs du controle navigateur, remplacees par celles du serveur apres envoi
  const [clientErrors, setClientErrors] = useState<Record<string, string> | null>(null);
  const [syncedState, setSyncedState] = useState(state);
  if (state !== syncedState) {
    setSyncedState(state);
    setClientErrors(null);
    if (state?.documents) setDocuments(state.documents);
  }
  const errors = clientErrors ?? state?.fieldErrors ?? {};

  const uploading = coverProgress !== null || audioProgress !== null || docProgress !== null;
  const video = videoUrl.trim() ? parseVideoUrl(videoUrl) : null;
  const spotify = spotifyUrl.trim() ? parseSpotifyUrl(spotifyUrl) : null;

  // place la vue sur le premier champ en erreur (uniquement apres une tentative d'envoi)
  const fieldErrors = clientErrors ?? state?.fieldErrors;
  useEffect(() => {
    const firstKey = fieldErrors ? Object.keys(fieldErrors)[0] : undefined;
    if (!firstKey) return;
    const field = formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [fieldErrors]);

  async function upload(kind: UploadKindName, file: File, setProgress: (value: number | null) => void) {
    const validationError = validateUpload(kind, file);
    if (validationError) throw new Error(validationError);
    setProgress(0);
    try {
      return await uploadMedia(kind, file, setProgress);
    } finally {
      setProgress(null);
    }
  }

  async function handleCover(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadError(null);
    try {
      const data = await upload("image", file, setCoverProgress);
      setCoverImageUrl(data.url);
    } catch (error) {
      setUploadError(`Image : ${error instanceof Error ? error.message : "échec de l'envoi."}`);
    }
  }

  async function handleAudio(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setUploadError(null);
    try {
      const [data, seconds] = await Promise.all([upload("audio", file, setAudioProgress), readAudioDuration(file)]);
      setAudioUrl(data.url);
      if (seconds && !duration.trim()) setDuration(formatDuration(seconds));
    } catch (error) {
      setUploadError(`Audio : ${error instanceof Error ? error.message : "échec de l'envoi."}`);
    }
  }

  async function handleDocuments(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;
    setUploadError(null);

    const remaining = MAX_DOCUMENTS - documents.length;
    if (files.length > remaining) {
      setUploadError(`${MAX_DOCUMENTS} fichiers maximum : vous pouvez encore en ajouter ${remaining}.`);
      return;
    }

    const failures: string[] = [];
    for (const [index, file] of files.entries()) {
      setDocQueueLabel(files.length > 1 ? `${index + 1} / ${files.length}` : null);
      try {
        const data = await upload("file", file, setDocProgress);
        setDocuments((current) => [
          ...current,
          { url: data.url, fileName: data.fileName, mimeType: mimeTypeFor("file", file.name), sizeBytes: file.size },
        ]);
      } catch (error) {
        failures.push(`${file.name} : ${error instanceof Error ? error.message : "échec de l'envoi."}`);
      }
    }
    setDocQueueLabel(null);
    if (failures.length) setUploadError(failures.join(" — "));
  }

  function moveDocument(index: number, offset: -1 | 1) {
    setDocuments((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + offset, 0, moved);
      return next;
    });
  }

  /** Controle navigateur avec le meme schema que le serveur. */
  function validateBeforeSubmit(formData: FormData) {
    if (isPending || uploading) return false;
    const result = teachingSchema.safeParse(teachingInputFromFormData(formData));
    if (result.success) {
      setClientErrors(null);
      return true;
    }
    setClientErrors(fieldErrorsOf(result.error.issues));
    return false;
  }

  const section = SECTIONS[TYPE_TO_SECTION[type]];
  const showDocuments = true;
  const showDownloadPolicy = type === "FILE" || type === "BOOK" || documents.length > 0;

  return (
    <form ref={formRef} onSubmit={submitWithoutReset(formAction, validateBeforeSubmit)} noValidate className="space-y-8">
      <input type="hidden" name="documents" value={JSON.stringify(documents)} />
      <input type="hidden" name="coverImageUrl" value={coverImageUrl} />

      {/* Type */}
      <Panel title="Type de ressource" description="Détermine la rubrique du site où la ressource apparaît.">
        <fieldset data-field="type">
          <legend className="sr-only">Type de ressource</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                  type === option.value ? "border-navy-900 bg-navy-900 text-ivory-100" : "border-ink-900/15 bg-white hover:border-navy-900",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                  className="sr-only"
                />
                <TypeIcon type={option.value} className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className={cn("block text-xs", type === option.value ? "text-ivory-100/70" : "text-ink-500")}>
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Panel>

      {/* Informations */}
      <Panel title="Informations">
        <Field name="title" label="Titre" required error={errors.title}>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            value={title}
            aria-invalid={Boolean(errors.title)}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value).slice(0, 120));
            }}
            className={inputClass}
          />
        </Field>

        <Field name="slug" label="Adresse (slug)" required error={errors.slug} hint={`Adresse publique : ${section.path}/${slug || "…"}`}>
          <input
            id="slug"
            name="slug"
            required
            maxLength={120}
            value={slug}
            aria-invalid={Boolean(errors.slug)}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            className={inputClass}
          />
        </Field>

        <Field
          name="excerpt"
          label="Description courte"
          error={errors.excerpt}
          hint="Affichée sur les cartes et en introduction de la fiche. Facultative."
          counter={{ value: excerpt.length, max: 320 }}
        >
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            maxLength={320}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          name="description"
          label="Description complète"
          required
          error={errors.description}
          hint="Ligne vide = nouveau paragraphe · ## Titre = sous-titre · - élément = liste · **texte** = gras"
        >
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            maxLength={20000}
            defaultValue={defaults.description}
            aria-invalid={Boolean(errors.description)}
            className={cn(inputClass, "leading-relaxed")}
          />
        </Field>
      </Panel>

      {/* Audio */}
      <Panel title="Audio" hidden={type !== "AUDIO"} description="Ajoutez un fichier audio, un lien Spotify, ou les deux.">
        <Field name="audioUrl" label="Fichier audio" error={errors.audioUrl} hint={`${UPLOAD_RULES.audio.label}, 200 Mo maximum. La durée est détectée automatiquement.`}>
          <input
            type="file"
            accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,.mp3,.m4a,.aac,.ogg,.oga,.wav"
            disabled={audioProgress !== null}
            onChange={(event) => handleAudio(event.currentTarget)}
            className={fileInputClass}
            aria-label="Envoyer un fichier audio"
          />
          {audioProgress !== null ? <UploadProgress percent={audioProgress} /> : null}
          <input
            id="audioUrl"
            name="audioUrl"
            value={audioUrl}
            onChange={(event) => setAudioUrl(event.target.value)}
            placeholder="ou lien direct vers un fichier audio (https://…)"
            className={cn(inputClass, "mt-3")}
            aria-label="Lien du fichier audio"
          />
          {audioUrl ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <audio src={audioUrl} controls preload="none" className="h-10 max-w-full" />
              <button type="button" onClick={() => setAudioUrl("")} className="text-xs font-medium text-red-700 hover:underline">
                Retirer l&apos;audio
              </button>
            </div>
          ) : null}
        </Field>
      </Panel>

      {/* Video */}
      <Panel title="Vidéo" hidden={type !== "VIDEO"}>
        <Field name="videoUrl" label="Lien de la vidéo (YouTube ou Vimeo)" required={type === "VIDEO"} error={errors.videoUrl}>
          <input
            id="videoUrl"
            name="videoUrl"
            type="url"
            value={videoUrl}
            aria-invalid={Boolean(errors.videoUrl)}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className={inputClass}
          />
          {video ? (
            <div className="mt-3 flex items-center gap-3">
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="Aperçu de la vidéo" className="h-16 w-28 rounded-lg object-cover" />
              ) : null}
              <p className="text-xs text-emerald-800">Vidéo {VIDEO_PROVIDER_LABELS[video.provider]} reconnue (fournisseur détecté automatiquement).</p>
            </div>
          ) : videoUrl.trim() ? (
            <p className="mt-1 text-xs text-orange-800">Lien non reconnu : seuls YouTube et Vimeo sont acceptés.</p>
          ) : null}
        </Field>
      </Panel>

      {/* Spotify + duree + serie (audio / video) */}
      <Panel title="Diffusion" hidden={type !== "AUDIO" && type !== "VIDEO"}>
        <Field
          name="spotifyUrl"
          label={type === "VIDEO" ? "Version audio sur Spotify (facultatif)" : "Lien Spotify"}
          error={errors.spotifyUrl}
          hint="Lien d'un épisode, d'un titre, d'une émission ou d'une playlist Spotify (« Partager » > « Copier le lien »)."
        >
          <input
            id="spotifyUrl"
            name="spotifyUrl"
            type="url"
            value={spotifyUrl}
            onChange={(event) => setSpotifyUrl(event.target.value)}
            placeholder="https://open.spotify.com/episode/…"
            className={inputClass}
          />
          {spotify ? (
            <p className="mt-1 text-xs text-emerald-800">Contenu Spotify reconnu.</p>
          ) : spotifyUrl.trim() ? (
            <p className="mt-1 text-xs text-orange-800">Lien Spotify non reconnu.</p>
          ) : null}
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="duration" label="Durée" error={errors.duration} hint="Ex. : 45 (minutes), 42:10 ou 1:02:05">
            <input id="duration" name="duration" value={duration} onChange={(event) => setDuration(event.target.value)} className={inputClass} />
          </Field>
          <Field name="series" label="Série" error={errors.series} hint="Regroupe plusieurs épisodes (facultatif).">
            <input id="series" name="series" maxLength={120} defaultValue={defaults.series} className={inputClass} />
          </Field>
        </div>
      </Panel>

      {/* Livre */}
      <Panel title="Livre" hidden={type !== "BOOK"} description="Renseignez uniquement les possibilités réelles de l'ouvrage.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="subtitle" label="Sous-titre" error={errors.subtitle}>
            <input id="subtitle" name="subtitle" maxLength={200} defaultValue={defaults.subtitle} className={inputClass} />
          </Field>
          <Field name="author" label="Auteur" error={errors.author}>
            <input id="author" name="author" maxLength={200} defaultValue={defaults.author} className={inputClass} />
          </Field>
          <Field name="isbn" label="ISBN" error={errors.isbn} hint="Facultatif (10 ou 13 chiffres).">
            <input id="isbn" name="isbn" maxLength={20} defaultValue={defaults.isbn} className={inputClass} />
          </Field>
        </div>
        <fieldset data-field="bookFormats" className="space-y-2">
          <legend className="font-data text-xs font-semibold uppercase tracking-wide text-ink-700">Formats disponibles</legend>
          <div className="flex flex-wrap gap-2">
            {BOOK_FORMATS.map((format) => (
              <label
                key={format}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-ink-900/15 bg-white px-4 py-2 text-sm has-[:checked]:border-navy-900 has-[:checked]:bg-navy-900 has-[:checked]:text-ivory-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-500"
              >
                <input type="checkbox" name="bookFormats" value={format} defaultChecked={defaults.bookFormats.includes(format)} className="sr-only" />
                {format}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="readUrl" label="Lien de lecture en ligne" error={errors.readUrl}>
            <input id="readUrl" name="readUrl" type="url" defaultValue={defaults.readUrl} placeholder="https://…" className={inputClass} />
          </Field>
          <Field name="purchaseUrl" label="Lien d'achat" error={errors.purchaseUrl}>
            <input id="purchaseUrl" name="purchaseUrl" type="url" defaultValue={defaults.purchaseUrl} placeholder="https://…" className={inputClass} />
          </Field>
        </div>
      </Panel>

      {/* Fichiers joints */}
      <Panel title={DOCUMENT_LABELS[type]} hidden={!showDocuments}>
        <Field name="documents" label={`Fichiers (${documents.length})`} error={errors.documents} hint={`${UPLOAD_RULES.file.label}. 50 Mo maximum par fichier, ${MAX_DOCUMENTS} fichiers maximum. Les fichiers retirés ne sont supprimés qu'à l'enregistrement.`}>
          {documents.length > 0 ? (
            <ul className="mb-3 divide-y divide-ink-900/10 rounded-xl border border-ink-900/10 bg-white">
              {documents.map((document, index) => (
                <li key={document.url} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span aria-hidden className="font-data text-xs text-ink-500">
                    {index + 1}.
                  </span>
                  <input
                    value={document.fileName}
                    onChange={(event) =>
                      setDocuments((current) => current.map((doc, i) => (i === index ? { ...doc, fileName: event.target.value } : doc)))
                    }
                    aria-label={`Nom affiché du fichier ${index + 1}`}
                    maxLength={255}
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-ink-900 hover:border-ink-900/15 focus:border-navy-900 focus:outline-none"
                  />
                  {document.sizeBytes ? <span className="text-xs text-ink-500">{formatFileSize(document.sizeBytes)}</span> : null}
                  {document.id ? null : <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-900">non enregistré</span>}
                  <a href={document.url} target="_blank" rel="noreferrer" className="text-xs text-navy-900 underline">
                    Ouvrir
                  </a>
                  <button type="button" onClick={() => moveDocument(index, -1)} disabled={index === 0} aria-label={`Monter le fichier ${index + 1}`} className="px-1 text-ink-500 hover:text-navy-900 disabled:opacity-30">
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDocument(index, 1)}
                    disabled={index === documents.length - 1}
                    aria-label={`Descendre le fichier ${index + 1}`}
                    className="px-1 text-ink-500 hover:text-navy-900 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocuments((current) => current.filter((_, i) => i !== index))}
                    className="text-xs font-medium text-red-700 hover:underline"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            type="file"
            multiple
            accept={Object.keys(UPLOAD_RULES.file.types).map((extension) => `.${extension}`).join(",")}
            disabled={docProgress !== null || documents.length >= MAX_DOCUMENTS}
            onChange={(event) => handleDocuments(event.currentTarget)}
            className={fileInputClass}
            aria-label="Ajouter des fichiers"
          />
          {docProgress !== null ? <UploadProgress percent={docProgress} label={docQueueLabel} /> : null}
        </Field>

        <div hidden={!showDownloadPolicy}>
          <Field name="downloadPolicy" label="Politique de téléchargement" error={errors.downloadPolicy}>
            <select id="downloadPolicy" name="downloadPolicy" defaultValue={defaults.downloadPolicy} className={inputClass}>
              <option value="DOWNLOAD">Consultation et téléchargement autorisés</option>
              <option value="VIEW_ONLY">Consultation sur le site uniquement (PDF, lecteur intégré sans téléchargement)</option>
            </select>
          </Field>
        </div>
      </Panel>

      {/* Visuel */}
      <Panel title="Visuel">
        <Field name="coverImageUrl" label={IMAGE_LABELS[type]} error={errors.coverImageUrl} hint="JPEG, PNG ou WebP, 8 Mo maximum.">
          <div className="flex flex-wrap items-start gap-4">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt="Aperçu de l'image"
                className={cn("rounded-lg object-cover", type === "BOOK" ? "h-36 w-24" : "h-24 w-40")}
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={coverProgress !== null}
                onChange={(event) => handleCover(event.currentTarget)}
                className={fileInputClass}
                aria-label={coverImageUrl ? "Remplacer l'image" : "Ajouter une image"}
              />
              {coverProgress !== null ? <UploadProgress percent={coverProgress} /> : null}
              {coverImageUrl ? (
                <button type="button" onClick={() => setCoverImageUrl("")} className="text-xs font-medium text-red-700 hover:underline">
                  Retirer l&apos;image
                </button>
              ) : null}
            </div>
          </div>
        </Field>
      </Panel>

      {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}

      {/* Classement */}
      <Panel title="Classement">
        <fieldset data-field="categoryIds" className="space-y-2">
          <legend className="font-data text-xs font-semibold uppercase tracking-wide text-ink-700">Catégories (facultatif)</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-ink-900/15 bg-white px-4 py-2 text-sm has-[:checked]:border-navy-900 has-[:checked]:bg-navy-900 has-[:checked]:text-ivory-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-500"
              >
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={defaults.categoryIds.includes(category.id)}
                  className="sr-only"
                />
                {category.name}
                {category.isActive === false ? <span className="text-xs opacity-70">(masquée)</span> : null}
              </label>
            ))}
            {categories.length === 0 ? <p className="text-sm text-ink-500">Aucune catégorie : créez-en depuis le menu Catégories.</p> : null}
          </div>
          {errors.categoryIds ? <p className="text-xs text-red-700">{errors.categoryIds}</p> : null}
        </fieldset>

        <Field name="tags" label="Mots-clés (séparés par des virgules)" error={errors.tags} hint="Utilisés par la recherche du site.">
          <input id="tags" name="tags" defaultValue={defaults.tags} placeholder="foi, prière, famille" className={inputClass} />
        </Field>
      </Panel>

      {/* Publication */}
      <Panel title="Publication">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="status" label="Statut" error={errors.status}>
            <select id="status" name="status" defaultValue={defaults.status} className={inputClass}>
              <option value="DRAFT">Brouillon (non visible)</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé (retiré du site)</option>
            </select>
          </Field>
          <Field name="publishedAt" label="Date de publication" error={errors.publishedAt} hint="Vide = date du jour à la publication. Une date future programme l'affichage.">
            <input id="publishedAt" name="publishedAt" type="date" defaultValue={defaults.publishedAt} className={inputClass} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-900">
          <input type="checkbox" name="featured" defaultChecked={defaults.featured} className="h-4 w-4 accent-navy-900" />
          Mettre en avant sur la page d&apos;accueil
        </label>
      </Panel>

      {/* SEO */}
      <Panel title="Référencement (SEO)" description="Facultatif : à défaut, le titre et la description courte sont utilisés.">
        <Field name="seoTitle" label="Titre SEO" error={errors.seoTitle} counter={{ value: seoTitle.length, max: 70 }}>
          <input id="seoTitle" name="seoTitle" maxLength={70} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className={inputClass} />
        </Field>
        <Field name="seoDescription" label="Description SEO" error={errors.seoDescription} counter={{ value: seoDescription.length, max: 170 }}>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            maxLength={170}
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="rounded-xl border border-ink-900/10 bg-white p-4" aria-label="Aperçu dans un moteur de recherche">
          <p className="truncate text-xs text-emerald-800">
            {section.path}/{slug || "…"}
          </p>
          <p className="truncate text-base text-[#1a0dab]">{(seoTitle || title || "Titre de la ressource") + " — Jean-Marc GNALI"}</p>
          <p className="line-clamp-2 text-sm text-ink-500">{seoDescription || excerpt || "Description de la ressource."}</p>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 space-y-3 border-t border-ink-900/10 bg-ivory-100/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-10 md:px-10">
        <FormAlerts state={clientErrors ? { error: "Veuillez corriger les champs signalés." } : state} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={isPending || uploading}
            className="rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-ivory-100 hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Enregistrement…" : isCreation ? "Créer la ressource" : "Enregistrer les modifications"}
          </button>
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={isPending || uploading}
            className="rounded-full border border-navy-900/25 px-6 py-3 text-sm font-semibold text-navy-900 hover:border-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enregistrer comme brouillon
          </button>
          {uploading ? <span className="text-xs text-ink-500">Envoi de fichier en cours…</span> : null}
        </div>
      </div>
    </form>
  );
}

function Panel({
  title,
  description,
  hidden,
  children,
}: {
  title: string;
  description?: string;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  // masque (et non retire) : les valeurs saisies sont conservees si le type change
  return (
    <section hidden={hidden} className="space-y-6 rounded-2xl border border-ink-900/10 bg-ivory-50 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-medium text-navy-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  name,
  label,
  required,
  error,
  hint,
  counter,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-field={name}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={name} className="font-data text-xs font-semibold uppercase tracking-wide text-ink-700">
          {label}
          {required ? (
            <span className="text-red-700" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
        {counter ? (
          <span className={cn("font-data text-xs", counter.value > counter.max ? "text-red-700" : "text-ink-500")}>
            {counter.value} / {counter.max}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-ink-500">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function UploadProgress({ percent, label }: { percent: number | null; label?: string | null }) {
  const value = percent ?? 0;
  return (
    <div className="mt-2 space-y-1" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'envoi">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10">
        <div className="h-full rounded-full bg-navy-900 transition-all" style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-ink-500">
        {label ? `Fichier ${label} — ` : ""}
        {value < 100 ? `Envoi en cours… ${value} %` : "Vérification du fichier…"}
      </p>
    </div>
  );
}
