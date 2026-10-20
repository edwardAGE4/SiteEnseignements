import { buttonClassName } from "@/components/ui/Button";
import { LikeButton } from "@/components/public/Likes";
import { DownloadIcon, FileIcon } from "@/components/ui/Icons";
import { formatFileSize } from "@/lib/media";
import { fileExtension, formatLabel } from "@/lib/file-validation";
import { DocumentViewerButton } from "@/components/public/DocumentViewerButton";

type Document = { id: string; fileName: string; mimeType: string | null; sizeBytes: number | null };

/** Seuls les PDF s'affichent dans le lecteur integre. */
function isPdf(document: Document) {
  return document.mimeType === "application/pdf" || fileExtension(document.fileName) === "pdf";
}

/**
 * Fichiers joints a une ressource. Les liens passent par une route du site qui
 * verifie que la ressource est publiee et que le telechargement est autorise.
 * (Liens <a> classiques : ils renvoient un fichier, pas une page.)
 */
export function DocumentList({
  slug,
  documents,
  allowDownload,
  title = "Fichiers disponibles",
  description,
  withLikes = true,
}: {
  slug: string;
  documents: Document[];
  allowDownload: boolean;
  title?: string;
  description?: string;
  withLikes?: boolean;
}) {
  if (documents.length === 0) return null;

  return (
    <section aria-labelledby={`documents-${slug}`} className="min-w-0 rounded-3xl bg-white p-5 ring-1 ring-navy-900/[0.07] sm:p-8">
      <h2 id={`documents-${slug}`} className="font-display text-2xl font-medium text-navy-900">
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      {!allowDownload ? (
        <p className="mt-1 text-sm text-ink-500">Ces fichiers se consultent en ligne, sur le site uniquement.</p>
      ) : null}

      <ul className="mt-6 divide-y divide-navy-900/10">
        {documents.map((document) => {
          const href = `/api/enseignements/${slug}/telecharger?doc=${document.id}`;
          const meta = [formatLabel(document.mimeType ?? document.fileName) || formatLabel(document.fileName), formatFileSize(document.sizeBytes)]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={document.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                  <FileIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold wrap-anywhere text-ink-900 sm:truncate" title={document.fileName}>
                    {document.fileName}
                  </p>
                  {meta ? <p className="text-xs text-ink-500">{meta}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {allowDownload ? (
                  <a href={href} target="_blank" rel="noopener" className={buttonClassName({ variant: "outline", size: "sm" })}>
                    Consulter
                    <span className="sr-only"> {document.fileName} (nouvel onglet)</span>
                  </a>
                ) : isPdf(document) ? (
                  <DocumentViewerButton slug={slug} documentId={document.id} fileName={document.fileName} />
                ) : (
                  <p className="text-sm text-ink-500">Consultation en ligne indisponible pour ce format.</p>
                )}
                {allowDownload ? (
                  <a href={`${href}&mode=telechargement`} download className={buttonClassName({ variant: "primary", size: "sm" })}>
                    <DownloadIcon className="h-4 w-4" />
                    Télécharger
                    <span className="sr-only"> {document.fileName}</span>
                  </a>
                ) : null}
                {withLikes ? <LikeButton target={`pdf:${document.id}`} label={document.fileName} /> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
