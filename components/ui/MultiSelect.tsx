"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

/** Liste deroulante a choix multiples (cases a cocher). */
export function MultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  /** Texte affiche quand rien n'est selectionne, ex. "Toutes les categories". */
  allLabel: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  let summary = allLabel;
  if (selectedLabels.length > 2) summary = `${selectedLabels.length} selectionnes`;
  else if (selectedLabels.length > 0) summary = selectedLabels.join(", ");

  return (
    <div ref={containerRef} className="relative w-full sm:w-64">
      <span className="mb-1.5 block font-accent text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-full border bg-ivory-50 px-4 py-2.5 text-left text-sm transition-colors focus:outline-none",
          open || selected.length ? "border-navy-900 text-navy-900" : "border-ink-900/15 text-ink-700",
        )}
      >
        <span className="truncate">{summary}</span>
        <span className="flex shrink-0 items-center gap-2">
          {selected.length ? (
            <span className="rounded-full bg-navy-900 px-2 py-0.5 text-xs font-medium text-ivory-100">
              {selected.length}
            </span>
          ) : null}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-ink-900/10 bg-ivory-50 shadow-lg"
        >
          <ul className="max-h-72 overflow-y-auto py-2" aria-label={label}>
            {options.map((option) => (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-ink-900 hover:bg-ivory-200">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="h-4 w-4 accent-navy-900"
                  />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
          {selected.length ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full border-t border-ink-900/10 px-4 py-2.5 text-left text-xs font-medium text-navy-900 hover:bg-ivory-200"
            >
              Tout deselectionner
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
