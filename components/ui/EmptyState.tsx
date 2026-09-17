export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-900/15 px-8 py-16 text-center">
      <p className="font-display text-xl font-semibold text-navy-900">{title}</p>
      {description ? <p className="max-w-md text-sm text-ink-500">{description}</p> : null}
    </div>
  );
}
