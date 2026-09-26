import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  light = false,
  centered = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
  /** centre le surtitre, avec un trait de chaque cote */
  centered?: boolean;
}) {
  const line = <span className={cn("h-px w-10 shrink-0", light ? "bg-gold-300" : "bg-gold-500")} />;

  return (
    <span
      className={cn(
        "flex items-center gap-3 font-accent text-xs font-semibold uppercase tracking-[0.3em]",
        centered && "justify-center text-center",
        light ? "text-gold-300" : "text-gold-600",
        className,
      )}
    >
      {line}
      {children}
      {centered ? line : null}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  className,
  light = false,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  className?: string;
  light?: boolean;
  align?: "center" | "left";
}) {
  const centered = align === "center";

  return (
    <div className={cn("space-y-4", centered && "mx-auto text-center", className)}>
      {eyebrow ? (
        <Eyebrow light={light} centered={centered}>
          {eyebrow}
        </Eyebrow>
      ) : null}
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
