"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string };

const FORMATS: { value: string; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "pdf", label: "PDF" },
];

const SORTS: { value: string; label: string }[] = [
  { value: "recent", label: "Plus recents" },
  { value: "popular", label: "Plus consultes" },
  { value: "alpha", label: "Alphabetique" },
];

export function SearchAndFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateParam("q", query || null);
  }

  const activeCategory = searchParams.get("categorie");
  const activeFormat = searchParams.get("format");
  const activeSort = searchParams.get("tri") ?? "recent";

  return (
    <div className={cn("space-y-8", isPending && "opacity-70 transition-opacity")}>
      <form onSubmit={onSubmit} className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un enseignement..."
          className="w-full rounded-full border border-ink-900/15 bg-ivory-50 px-6 py-4 text-base text-ink-900 placeholder:text-ink-300 focus:border-navy-900 focus:outline-none"
          aria-label="Rechercher un enseignement"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-navy-900 px-6 py-4 font-accent text-sm font-medium text-ivory-100 transition-colors hover:bg-navy-800"
        >
          Rechercher
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-accent text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
            Categorie
          </span>
          <FilterPill
            active={!activeCategory}
            onClick={() => updateParam("categorie", null)}
            label="Toutes"
          />
          {categories.map((category) => (
            <FilterPill
              key={category.slug}
              active={activeCategory === category.slug}
              onClick={() => updateParam("categorie", category.slug)}
              label={category.name}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-accent text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
            Format
          </span>
          <FilterPill active={!activeFormat} onClick={() => updateParam("format", null)} label="Tous" />
          {FORMATS.map((format) => (
            <FilterPill
              key={format.value}
              active={activeFormat === format.value}
              onClick={() => updateParam("format", format.value)}
              label={format.label}
            />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="tri" className="font-accent text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">
            Trier par
          </label>
          <select
            id="tri"
            value={activeSort}
            onChange={(event) => updateParam("tri", event.target.value)}
            className="rounded-full border border-ink-900/15 bg-ivory-50 px-4 py-2 text-sm text-ink-900 focus:border-navy-900 focus:outline-none"
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 font-accent text-sm transition-colors",
        active
          ? "border-navy-900 bg-navy-900 text-ivory-100"
          : "border-ink-900/15 text-ink-700 hover:border-navy-900",
      )}
    >
      {label}
    </button>
  );
}
