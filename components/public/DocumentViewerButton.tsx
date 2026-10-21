"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";

// pdf.js n'est charge qu'a l'ouverture d'un document
const PdfViewer = dynamic(() => import("@/components/public/PdfViewer").then((module) => module.PdfViewer), { ssr: false });

/**
 * « Consulter » d'un PDF : ouvre le lecteur integre (le document reste dans
 * le site, y compris dans l'application installee). En consultation seule,
 * le lecteur est protege ; sinon il propose de telecharger le fichier.
 */
export function DocumentViewerButton({
  slug,
  documentId,
  fileName,
  allowDownload = false,
}: {
  slug: string;
  documentId: string;
  fileName: string;
  allowDownload?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName({ variant: allowDownload ? "outline" : "primary", size: "sm" })}
      >
        Consulter
        <span className="sr-only"> {fileName}</span>
      </button>
      {open ? (
        <PdfViewer
          src={`/api/enseignements/${slug}/consulter?doc=${documentId}`}
          title={fileName}
          onClose={close}
          protect={!allowDownload}
          downloadHref={
            allowDownload ? `/api/enseignements/${slug}/telecharger?doc=${documentId}&mode=telechargement` : undefined
          }
        />
      ) : null}
    </>
  );
}
