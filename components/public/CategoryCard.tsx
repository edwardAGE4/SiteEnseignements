import Link from "next/link";

export function CategoryCard({
  category,
}: {
  category: { slug: string; name: string; description: string | null; teachingCount: number };
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-ink-900/10 bg-ivory-50 p-8 transition-colors hover:border-gold-400"
    >
      <div>
        <h3 className="font-display text-2xl font-semibold text-navy-900">{category.name}</h3>
        {category.description ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-500">{category.description}</p>
        ) : null}
      </div>
      <div className="mt-8 flex items-center justify-between font-data text-xs text-ink-300">
        <span>
          {category.teachingCount} enseignement{category.teachingCount > 1 ? "s" : ""}
        </span>
        <span className="text-navy-900 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
