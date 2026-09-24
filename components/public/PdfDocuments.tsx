import { buttonClassName } from "@/components/ui/Button";
import { LikeButton } from "@/components/public/Likes";

type Document = { id: string; fileName: string };

// Liens <a> classiques (et non <Link>) : ils pointent vers une route API qui
// renvoie un fichier, pas vers une page de l'application.
export function PdfDocuments({ slug, documents }: { slug: string; documents: Document[] }) {
  if (documents.length === 0) return null;

  return (
    <section className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
      <p className="font-display text-lg font-semibold text-navy-900">
        {documents.length > 1 ? `Documents PDF (${documents.length})` : "Document PDF"}
      </p>
      <p className="text-sm text-ink-500">Retrouvez cet enseignement au format ecrit.</p>

      <ul className="mt-4 divide-y divide-ink-900/10">
        {documents.map((document) => {
          const href = `/api/enseignements/${slug}/telecharger?doc=${document.id}`;
          return (
            <li key={document.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <p className="min-w-0 flex-1 truncate font-medium text-ink-900" title={document.fileName}>
                {document.fileName}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a href={href} target="_blank" rel="noopener" className={buttonClassName({ variant: "primary", size: "sm" })}>
                  Lire
                  <span className="sr-only"> {document.fileName} (s&apos;ouvre dans un nouvel onglet)</span>
                </a>
                <a
                  href={`${href}&mode=telechargement`}
                  download
                  className={buttonClassName({ variant: "outline", size: "sm" })}
                >
                  Telecharger
                  <span className="sr-only"> {document.fileName}</span>
                </a>
                <LikeButton target={`pdf:${document.id}`} label={document.fileName} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
