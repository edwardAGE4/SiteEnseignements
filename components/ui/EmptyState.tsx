import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-navy-900/15 bg-white/60 px-8 py-16 text-center",
        className,
      )}
    >
      <span aria-hidden className="h-px w-10 bg-gold-500" />
      <p className="font-display text-xl font-medium text-navy-900">{title}</p>
      {description ? <p className="max-w-md text-sm leading-relaxed text-ink-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
