import { cn } from "@/lib/utils";

type Status = "PUBLISHED" | "DRAFT" | "ARCHIVED";

const STATUS: Record<Status, { label: string; className: string }> = {
  PUBLISHED: { label: "Publié", className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700/20" },
  DRAFT: { label: "Brouillon", className: "bg-ink-900/5 text-ink-700 ring-1 ring-ink-900/10" },
  ARCHIVED: { label: "Archivé", className: "bg-orange-50 text-orange-800 ring-1 ring-orange-700/20" },
};

export const STATUS_LABELS: Record<Status, string> = {
  PUBLISHED: STATUS.PUBLISHED.label,
  DRAFT: STATUS.DRAFT.label,
  ARCHIVED: STATUS.ARCHIVED.label,
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 font-data text-xs font-medium", STATUS[status].className)}>
      {STATUS[status].label}
    </span>
  );
}

export function FormatBadge({ format, className }: { format: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-ink-900/10 px-2.5 py-1 font-data text-xs font-medium text-ink-700",
        className,
      )}
    >
      {format}
    </span>
  );
}
