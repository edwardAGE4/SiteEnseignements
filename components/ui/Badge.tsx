import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  DRAFT: "bg-ink-900/5 text-ink-500 ring-1 ring-ink-900/10",
};

export function StatusBadge({ status }: { status: "PUBLISHED" | "DRAFT" }) {
  const label = status === "PUBLISHED" ? "Publié" : "Brouillon";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-data text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {label}
    </span>
  );
}

export function FormatBadge({ format }: { format: "YouTube" | "Spotify" | "PDF" }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-900/10 px-2.5 py-1 font-data text-xs font-medium text-ink-700">
      {format}
    </span>
  );
}
