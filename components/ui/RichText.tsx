import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * Affiche un texte saisi dans l'admin avec une mise en forme simple :
 * - une ligne vide separe deux paragraphes
 * - un retour a la ligne simple est conserve
 * - "## Titre" en debut de ligne cree un sous-titre
 * - "- element" en debut de ligne cree une liste a puces
 * - **texte** met en gras
 * Le texte n'est jamais interprete comme du HTML (aucun risque d'injection).
 * Utilisable cote serveur (site public) comme cote client (apercu admin).
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-6", className)}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

const LIST_ITEM = /^[-•]\s+/;

type Segment = { kind: "heading" | "list" | "text"; lines: string[] };

/** Decoupe un bloc en sous-titres, listes et texte, meme sans ligne vide entre eux. */
function segment(block: string): Segment[] {
  const segments: Segment[] = [];
  for (const line of block.split("\n")) {
    const kind = line.startsWith("## ") ? "heading" : LIST_ITEM.test(line) ? "list" : "text";
    const last = segments.at(-1);
    if (last && last.kind === kind && kind !== "heading") last.lines.push(line);
    else segments.push({ kind, lines: [line] });
  }
  return segments;
}

function Block({ block }: { block: string }) {
  return (
    <>
      {segment(block).map((part, index) => {
        if (part.kind === "heading") {
          return (
            <h2 key={index} className="pt-4 font-display text-2xl font-semibold leading-snug text-navy-900">
              <Inline text={part.lines[0].slice(3)} />
            </h2>
          );
        }
        if (part.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 marker:text-gold-500">
              {part.lines.map((line, i) => (
                <li key={i}>
                  <Inline text={line.replace(LIST_ITEM, "")} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {part.lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 ? <br /> : null}
                <Inline text={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={index} className="font-semibold text-navy-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Titre sur plusieurs lignes : chaque retour a la ligne devient un <br />. */
export function MultilineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\r?\n/).map((line, index) => (
        <Fragment key={index}>
          {index > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}
