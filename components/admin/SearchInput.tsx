"use client";

/** Champ de recherche des listes de l'espace admin (filtrage immediat). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  resultLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** ex. "3 resultats", affiche pendant une recherche */
  resultLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-sm">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-full border border-ink-900/15 bg-ivory-50 py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-300 focus:border-navy-900 focus:outline-none"
        />
      </div>
      {value.trim() && resultLabel ? <p className="font-data text-xs text-ink-500">{resultLabel}</p> : null}
    </div>
  );
}
