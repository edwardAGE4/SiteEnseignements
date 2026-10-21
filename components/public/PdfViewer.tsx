"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { CloseIcon, DownloadIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

/** Entree d'historique du lecteur ouvert : le bouton « retour » ferme le lecteur. */
const VIEWER_HASH = "#document";

/**
 * Lecteur PDF integre, en plein ecran : les pages sont dessinees en images
 * (pdf.js) et le fichier arrive par morceaux depuis
 * /api/enseignements/[slug]/consulter. Le document reste dans le site, y
 * compris dans l'application installee (un PDF ouvert hors du site n'a pas
 * de bouton retour et relancait l'application).
 * - `protect` (consultation seule) : ni telechargement ni impression, clic
 *   droit et selection desactives. Frein, pas une protection absolue.
 * - `downloadHref` : bouton Telecharger dans la barre d'outils.
 */
export function PdfViewer({
  src,
  title,
  onClose,
  protect = true,
  downloadHref,
}: {
  src: string;
  title: string;
  onClose: () => void;
  protect?: boolean;
  downloadHref?: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Chargement du document
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        if (cancelled) return;
        const loading = pdfjs.getDocument({ url: src, disableAutoFetch: true, disableStream: true, rangeChunkSize: 1 << 20 });
        task = loading;
        const loaded = await loading.promise;
        if (!cancelled) setPdf(loaded);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [src]);

  // Bouton / geste « retour » (Android, iPhone, navigateur) : ferme le lecteur au
  // lieu de quitter la page. L'ouverture ajoute une entree a l'historique.
  useEffect(() => {
    // l'etat courant est recopie : le routeur de Next y retrouve ses donnees (sinon il recharge la page)
    if (window.location.hash !== VIEWER_HASH) window.history.pushState(window.history.state, "", VIEWER_HASH);
    const onPop = () => {
      if (window.location.hash !== VIEWER_HASH) onClose();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  // Fermeture par le bouton ou Echap : on retire l'entree d'historique (ce qui ferme le lecteur)
  const requestClose = useCallback(() => {
    if (window.location.hash === VIEWER_HASH) window.history.back();
    else onClose();
  }, [onClose]);

  // Fenetre modale : Echap pour fermer, pas de defilement de la page dessous
  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
      // Ctrl+S / Ctrl+P : pas d'enregistrement ni d'impression d'un document protege
      if (protect && (event.ctrlKey || event.metaKey) && ["s", "p"].includes(event.key.toLowerCase())) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose, protect]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn("fixed inset-0 z-[70] flex flex-col bg-navy-950/95", protect && "pdf-viewer select-none")}
      onContextMenu={protect ? (event) => event.preventDefault() : undefined}
    >
      <div className="flex items-center gap-3 border-b border-ivory-100/10 px-4 py-3 text-ivory-100 sm:px-6">
        <p id={titleId} className="min-w-0 flex-1 truncate font-display text-sm font-semibold sm:text-base">
          {title}
          {pdf ? <span className="ml-2 font-data text-xs font-normal text-ivory-100/60">{pdf.numPages} p.</span> : null}
        </p>
        <div className="flex items-center gap-1">
          <ToolbarButton label="Dézoomer" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} disabled={zoom <= 0.5}>
            −
          </ToolbarButton>
          <span className="w-12 text-center font-data text-xs text-ivory-100/70">{Math.round(zoom * 100)} %</span>
          <ToolbarButton label="Zoomer" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} disabled={zoom >= 3}>
            +
          </ToolbarButton>
        </div>
        {downloadHref ? (
          <a
            href={downloadHref}
            download
            aria-label="Télécharger le document"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-ivory-100/10"
          >
            <DownloadIcon className="h-5 w-5" />
          </a>
        ) : null}
        <button
          ref={closeRef}
          type="button"
          onClick={requestClose}
          aria-label="Fermer le document"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-ivory-100/10"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-3 py-6 sm:px-6">
        {error ? (
          <p role="alert" className="mx-auto max-w-md rounded-2xl bg-ivory-50 px-5 py-4 text-center text-sm text-ink-700">
            Ce document ne peut pas être affiché pour le moment. Réessayez plus tard.
          </p>
        ) : !pdf ? (
          <p role="status" className="text-center text-sm text-ivory-100/70">
            Chargement du document…
          </p>
        ) : (
          <div className="mx-auto flex flex-col items-center gap-4" style={{ width: `${zoom * 100}%`, maxWidth: `${zoom * 56}rem` }}>
            {Array.from({ length: pdf.numPages }, (_, index) => (
              <PdfPage key={index} pdf={pdf} pageNumber={index + 1} zoom={zoom} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-lg hover:bg-ivory-100/10 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Une page, dessinee seulement quand elle approche de l'ecran (documents longs). */
function PdfPage({ pdf, pageNumber, zoom }: { pdf: PDFDocumentProxy; pageNumber: number; zoom: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(pageNumber <= 2);
  const [ratio, setRatio] = useState(1.414); // A4 en attendant les dimensions reelles

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let task: { cancel: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (cancelled || !canvas || !wrapper) return;
      const base = page.getViewport({ scale: 1 });
      setRatio(base.height / base.width);
      // nettete sur ecrans haute densite
      const scale = (wrapper.clientWidth / base.width) * Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const render = page.render({ canvas, viewport });
      task = render;
      await render.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, pageNumber, visible, zoom]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full overflow-hidden rounded-sm bg-white shadow-xl")}
      style={{ aspectRatio: `1 / ${ratio}` }}
    >
      <canvas ref={canvasRef} aria-label={`Page ${pageNumber}`} role="img" className="pointer-events-none h-full w-full" />
    </div>
  );
}
