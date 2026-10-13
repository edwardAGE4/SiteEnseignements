"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { RESOURCE_SORTS, SECTION_LIST } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { SearchIcon } from "@/components/ui/Icons";

type Option = { value: string; label: string };

const selectClass =
  "h-12 w-full rounded-full border border-navy-900/15 bg-white px-4 text-sm text-ink-900 focus:border-navy-900 focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-ink-500";

/**
 * Recherche, filtres et tri d'une bibliotheque. Tout est conserve dans l'URL
 * (partage de lien, bouton retour) ; les resultats sont calcules cote serveur.
 */
export function LibraryFilters({
  placeholder,
  categories,
  series = [],
  showTypes = false,
}: {
  placeholder: string;
  categories: Option[];
  series?: string[];
  /** filtre par type de ressource (recherche transversale) */
  showTypes?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  function navigate(params: URLSearchParams) {
    params.delete("page");
    const queryString = params.toString();
    startTransition(() => router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false }));
  }

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    navigate(params);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateParam("q", query.trim() || null);
  }

  function reset() {
    setQuery("");
    navigate(new URLSearchParams());
  }

  const activeCategory = searchParams.get("categorie") ?? "";
  const activeSeries = searchParams.get("serie") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const activeSort = searchParams.get("tri") ?? "recent";
  const hasFilters = Boolean(searchParams.get("q") || activeCategory || activeSeries || activeType || activeSort !== "recent");

  return (
    <div className={cn("space-y-5 transition-opacity", isPending && "opacity-60")} aria-busy={isPending}>
      <form onSubmit={onSubmit} role="search" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="recherche-bibliotheque" className="sr-only">
          {placeholder}
        </label>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-ink-500" />
          <input
            id="recherche-bibliotheque"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            maxLength={120}
            className="h-14 w-full rounded-full border border-navy-900/15 bg-white pr-5 pl-13 text-base text-ink-900 placeholder:text-ink-500 focus:border-navy-900 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-14 shrink-0 rounded-full bg-navy-900 px-8 text-sm font-semibold text-ivory-100 transition-colors hover:bg-navy-700"
        >
          Rechercher
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        {showTypes ? (
          <div className="lg:w-56">
            <label htmlFor="filtre-type" className={labelClass}>
              Format
            </label>
            <select id="filtre-type" value={activeType} onChange={(event) => updateParam("type", event.target.value || null)} className={selectClass}>
              <option value="">Tous les formats</option>
              {SECTION_LIST.map((section) => (
                <option key={section.type} value={section.section}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {categories.length > 0 ? (
          <div className="lg:w-56">
            <label htmlFor="filtre-categorie" className={labelClass}>
              Catégorie
            </label>
            <select
              id="filtre-categorie"
              value={activeCategory}
              onChange={(event) => updateParam("categorie", event.target.value || null)}
              className={selectClass}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {series.length > 0 ? (
          <div className="lg:w-56">
            <label htmlFor="filtre-serie" className={labelClass}>
              Série
            </label>
            <select id="filtre-serie" value={activeSeries} onChange={(event) => updateParam("serie", event.target.value || null)} className={selectClass}>
              <option value="">Toutes les séries</option>
              {series.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="lg:ml-auto lg:w-52">
          <label htmlFor="filtre-tri" className={labelClass}>
            Trier par
          </label>
          <select id="filtre-tri" value={activeSort} onChange={(event) => updateParam("tri", event.target.value === "recent" ? null : event.target.value)} className={selectClass}>
            {RESOURCE_SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters ? (
          <button type="button" onClick={reset} className="h-12 text-left text-sm font-semibold text-navy-900 underline-offset-4 hover:underline lg:px-2">
            Réinitialiser
          </button>
        ) : null}
      </div>
    </div>
  );
}
