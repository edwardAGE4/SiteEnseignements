import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pages a afficher : 1 … 4 5 6 … 12 */
function visiblePages(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  function hrefFor(target: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const linkClass = "flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm transition-colors";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 pt-4" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(linkClass, "border border-navy-900/15 text-ink-700 hover:border-navy-900")}>
          Précédent
        </Link>
      ) : null}

      {visiblePages(page, pageCount).map((p, index) =>
        p === "…" ? (
          <span key={`ellipsis-${index}`} aria-hidden className="px-1 text-ink-500">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(linkClass, "px-0", p === page ? "bg-navy-900 text-ivory-100" : "text-ink-700 hover:bg-navy-900/5")}
          >
            {p}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(linkClass, "border border-navy-900/15 text-ink-700 hover:border-navy-900")}>
          Suivant
        </Link>
      ) : null}
    </nav>
  );
}
