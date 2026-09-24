"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/MultiSelect";

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

/** Les filtres multiples sont stockes dans l'URL separes par des virgules. */
function splitParam(value: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

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

  function resetFilters() {
    setQuery("");
    startTransition(() => {
      router.push(activeSort === "recent" ? pathname : `${pathname}?tri=${activeSort}`);
    });
  }

  const activeCategories = splitParam(searchParams.get("categorie"));
  const activeFormats = splitParam(searchParams.get("format"));
  const activeSort = searchParams.get("tri") ?? "recent";
  const hasFilters = Boolean(searchParams.get("q") || activeCategories.length || activeFormats.length);

  return (
    <div className={cn("space-y-6", isPending && "opacity-70 transition-opacity")}>
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

      <div className="flex flex-wrap items-end gap-4">
        <MultiSelect
          label="Categories"
          allLabel="Toutes les categories"
          options={categories.map((category) => ({ value: category.slug, label: category.name }))}
          selected={activeCategories}
          onChange={(values) => updateParam("categorie", values.join(",") || null)}
        />

        <MultiSelect
          label="Formats"
          allLabel="Tous les formats"
          options={FORMATS}
          selected={activeFormats}
          onChange={(values) => updateParam("format", values.join(",") || null)}
        />

        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="py-2.5 font-accent text-sm text-navy-900 underline-offset-4 hover:underline"
          >
            Reinitialiser
          </button>
        ) : null}

        <div className="w-full sm:ml-auto sm:w-auto">
          <label
            htmlFor="tri"
            className="mb-1.5 block font-accent text-xs font-semibold uppercase tracking-[0.2em] text-ink-300"
          >
            Trier par
          </label>
          <select
            id="tri"
            value={activeSort}
            onChange={(event) => updateParam("tri", event.target.value)}
            className="w-full rounded-full border border-ink-900/15 bg-ivory-50 px-4 py-2.5 text-sm text-ink-900 focus:border-navy-900 focus:outline-none"
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
