"use client";

import { useActionState, useRef, useState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { BIOGRAPHY_LIMITS } from "@/lib/validations/biography";
import { saveBiography } from "@/app/admin/(dashboard)/parametres/actions";
import type { Biography } from "@/lib/settings";
import { FormAlerts } from "@/components/ui/Alert";
import { MultilineText, RichText } from "@/components/ui/RichText";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

type Field = keyof Biography;

export function BiographySettingsForm({ initial }: { initial: Biography }) {
  const [state, formAction, isPending] = useActionState(saveBiography, undefined);
  const [values, setValues] = useState<Biography>(initial);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** Insere une mise en forme a la position du curseur dans la biographie. */
  function insertFormat(kind: "subtitle" | "list" | "bold" | "paragraph") {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end);
    const atLineStart = start === 0 || value[start - 1] === "\n";
    const prefix = atLineStart ? "" : "\n";

    const snippets = {
      subtitle: `${prefix}\n## ${selected || "Sous-titre"}\n`,
      list: `${prefix}- ${selected || "Premier élément"}\n- Deuxième élément\n`,
      bold: `**${selected || "texte en gras"}**`,
      paragraph: "\n\n",
    };
    const snippet = snippets[kind];
    const next = value.slice(0, start) + snippet + value.slice(end);
    update("body", next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  const errors = state?.fieldErrors ?? {};

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <form onSubmit={submitWithoutReset(formAction)} className="space-y-5">
        <FieldBlock label="Titre de la page" hint="Grand titre du bandeau. Un retour à la ligne = une nouvelle ligne." count={values.title} max={BIOGRAPHY_LIMITS.title} error={errors.title}>
          <textarea
            name="title"
            rows={2}
            required
            value={values.title}
            onChange={(event) => update("title", event.target.value)}
            className={inputClass}
          />
        </FieldBlock>

        <FieldBlock label="Introduction" hint="Phrase d'accroche mise en valeur au début du texte. Optionnelle." count={values.lead} max={BIOGRAPHY_LIMITS.lead} error={errors.lead}>
          <textarea
            name="lead"
            rows={3}
            value={values.lead}
            onChange={(event) => update("lead", event.target.value)}
            className={inputClass}
          />
        </FieldBlock>

        <FieldBlock label="Biographie détaillée" count={values.body} max={BIOGRAPHY_LIMITS.body} error={errors.body}>
          <div className="flex flex-wrap gap-2">
            <FormatButton onClick={() => insertFormat("paragraph")}>¶ Paragraphe</FormatButton>
            <FormatButton onClick={() => insertFormat("subtitle")}>Sous-titre</FormatButton>
            <FormatButton onClick={() => insertFormat("list")}>• Liste</FormatButton>
            <FormatButton onClick={() => insertFormat("bold")}>
              <strong>G</strong> Gras
            </FormatButton>
          </div>
          <textarea
            ref={bodyRef}
            name="body"
            rows={14}
            value={values.body}
            onChange={(event) => update("body", event.target.value)}
            className={`${inputClass} font-mono text-[13px] leading-relaxed`}
          />
          <p className="text-xs text-ink-500">
            Ligne vide = nouveau paragraphe · Retour à la ligne simple = saut de ligne ·{" "}
            <code>## Titre</code> = sous-titre · <code>- élément</code> = liste · <code>**texte**</code> = gras
          </p>
        </FieldBlock>

        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <FieldBlock label="Citation" hint="Bandeau en bas de page. Vide = masqué." count={values.quote} max={BIOGRAPHY_LIMITS.quote} error={errors.quote}>
            <textarea
              name="quote"
              rows={2}
              value={values.quote}
              onChange={(event) => update("quote", event.target.value)}
              className={inputClass}
            />
          </FieldBlock>
          <FieldBlock label="Source" hint="Ex. : Pasteur Jean-Marc GNALI" count={values.quoteSource} max={BIOGRAPHY_LIMITS.quoteSource} error={errors.quoteSource}>
            <input
              name="quoteSource"
              value={values.quoteSource}
              onChange={(event) => update("quoteSource", event.target.value)}
              className={inputClass}
            />
          </FieldBlock>
        </div>

        <FormAlerts state={state} />

        <ConfirmSubmitButton
          disabled={isPending}
          title="Publier la biographie ?"
          description="Le contenu de la page À propos sera remplacé par ce texte."
          className="rounded-full bg-navy-900 px-5 py-2.5 font-data text-sm font-medium text-ivory-100 hover:bg-navy-800 disabled:opacity-60"
        >
          {isPending ? "Publication..." : "Publier la biographie"}
        </ConfirmSubmitButton>
      </form>

      <div>
        <p className="mb-2 font-data text-xs font-medium uppercase tracking-wide text-ink-500">Aperçu en direct</p>
        <div className="overflow-hidden rounded-2xl border border-ink-900/10 xl:sticky xl:top-6">
          <div className="bg-navy-950 px-6 py-8">
            <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-400">À propos</p>
            <p className="mt-3 font-display text-3xl font-semibold leading-[1.1] text-ivory-100">
              <MultilineText text={values.title || " "} />
            </p>
          </div>
          <div className="max-h-[32rem] space-y-5 overflow-y-auto bg-ivory-100 px-6 py-8 text-base leading-relaxed text-ink-700">
            {values.lead ? (
              <p className="font-display text-xl font-semibold leading-snug text-navy-900">
                <MultilineText text={values.lead} />
              </p>
            ) : null}
            {values.body ? (
              <RichText text={values.body} className="space-y-5" />
            ) : (
              <p className="text-sm italic text-ink-300">Biographie vide</p>
            )}
          </div>
          {values.quote ? (
            <div className="bg-navy-900 px-6 py-8 text-center">
              <p className="font-display text-xl font-medium leading-snug text-ivory-100">{values.quote}</p>
              {values.quoteSource ? (
                <p className="mt-4 font-accent text-xs uppercase tracking-[0.25em] text-gold-300">{values.quoteSource}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink-900/15 bg-ivory-50 px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";

function FieldBlock({
  label,
  hint,
  count,
  max,
  error,
  children,
}: {
  label: string;
  hint?: string;
  count: string;
  max: number;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
        <span className={`font-data text-xs ${count.length > max ? "text-red-600" : "text-ink-300"}`}>
          {count.length} / {max}
        </span>
      </div>
      {hint ? <p className="text-xs text-ink-300">{hint}</p> : null}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function FormatButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-ink-900/15 px-3 py-1 font-data text-xs text-ink-700 hover:border-navy-900 hover:text-navy-900"
    >
      {children}
    </button>
  );
}
