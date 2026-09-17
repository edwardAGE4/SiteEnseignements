import { cn } from "@/lib/utils";

export function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-accent text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
