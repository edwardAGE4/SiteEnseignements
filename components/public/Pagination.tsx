import Link from "next/link";
import { cn } from "@/lib/utils";

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

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-full border border-ink-900/15 px-4 py-2 text-sm text-ink-700 hover:border-navy-900"
        >
          Precedent
        </Link>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full font-data text-sm",
            p === page
              ? "bg-navy-900 text-ivory-100"
              : "text-ink-700 hover:bg-ink-900/5",
          )}
        >
          {p}
        </Link>
      ))}

      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-full border border-ink-900/15 px-4 py-2 text-sm text-ink-700 hover:border-navy-900"
        >
          Suivant
        </Link>
      ) : null}
    </nav>
  );
}
