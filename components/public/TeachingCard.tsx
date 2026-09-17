import Link from "next/link";
import { formatYear, truncate } from "@/lib/utils";
import { Tag } from "@/components/ui/Tag";

type TeachingCardData = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date | string | null;
  coverImageUrl: string | null;
  categories: { category: { name: string } }[];
};

export function TeachingCard({ teaching }: { teaching: TeachingCardData }) {
  const primaryCategory = teaching.categories[0]?.category.name;

  return (
    <Link href={`/enseignements/${teaching.slug}`} className="group block">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-navy-900">
        {teaching.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={teaching.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(150deg,#102a43,#0b1f33)]">
            <span className="font-display text-3xl text-gold-400/70">JMG</span>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {primaryCategory ? <Tag>{primaryCategory}</Tag> : null}
        <h3 className="font-display text-xl font-semibold leading-snug text-navy-900 transition-colors group-hover:text-navy-700">
          {teaching.title}
        </h3>
        <p className="text-sm leading-relaxed text-ink-500">
          {truncate(teaching.description, 110)}
        </p>
        <div className="flex items-center gap-2 pt-1 font-data text-xs text-ink-300">
          <span>{formatYear(teaching.publishedAt)}</span>
          <span>·</span>
          <span>Enseignement</span>
        </div>
        <span className="inline-flex items-center gap-1 pt-2 font-accent text-sm font-medium text-navy-900 transition-colors group-hover:text-gold-600">
          Decouvrir
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
