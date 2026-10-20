"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";

// pdf.js n'est charge qu'a l'ouverture d'un document
const PdfViewer = dynamic(() => import("@/components/public/PdfViewer").then((module) => module.PdfViewer), { ssr: false });

/** « Consulter » d'un document en consultation seule : ouvre le lecteur PDF integre. */
export function DocumentViewerButton({ slug, documentId, fileName }: { slug: string; documentId: string; fileName: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName({ variant: "primary", size: "sm" })}>
        Consulter
        <span className="sr-only"> {fileName}</span>
      </button>
      {open ? (
        <PdfViewer src={`/api/enseignements/${slug}/consulter?doc=${documentId}`} title={fileName} onClose={close} />
      ) : null}
    </>
  );
}
