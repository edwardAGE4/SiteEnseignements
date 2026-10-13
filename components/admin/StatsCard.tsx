import Link from "next/link";

export function StatsCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <>
      <p className="font-data text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-3 font-display text-3xl font-medium text-navy-900">{value}</p>
    </>
  );
  const className = "block rounded-2xl border border-ink-900/10 bg-ivory-50 p-5";

  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-navy-900`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
