import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  light = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-3 font-accent text-xs font-semibold uppercase tracking-[0.3em]",
        light ? "text-gold-300" : "text-gold-600",
        className,
      )}
    >
      <span className={cn("h-px w-10", light ? "bg-gold-300" : "bg-gold-500")} />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  className,
  light = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {eyebrow ? <Eyebrow light={light}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "font-display text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.08]",
          light ? "text-ivory-100" : "text-navy-900",
        )}
      >
        {title}
      </h2>
    </div>
  );
}
