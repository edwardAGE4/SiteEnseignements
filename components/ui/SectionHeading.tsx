import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Eyebrow({
  children,
  className,
  light = false,
  centered = false,
  right = false,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
  /** centre le surtitre, avec un trait de chaque cote */
  centered?: boolean;
  /** aligne le surtitre a droite, trait apres le texte */
  right?: boolean;
}) {
  const line = <span aria-hidden className={cn("h-px w-8 shrink-0", light ? "bg-gold-300" : "bg-gold-500")} />;

  return (
    <span
      className={cn(
        "flex items-center gap-3 font-accent text-xs font-semibold uppercase tracking-[0.22em]",
        centered && "justify-center text-center",
        right && "justify-end text-right",
        light ? "text-gold-300" : "text-gold-600",
        className,
      )}
    >
      {right ? null : line}
      {children}
      {centered || right ? line : null}
    </span>
  );
}

/**
 * Titre de section. Avec `action`, un lien ("Tous les audios") est place a
 * droite du titre sur ordinateur et sous le titre sur mobile.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  light = false,
  align = "left",
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
  light?: boolean;
  align?: "center" | "left" | "right";
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  const right = align === "right";

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        centered
          ? "items-center text-center"
          : right
            ? "items-end md:flex-row-reverse md:justify-between"
            : "items-start md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("space-y-4", centered ? "mx-auto max-w-2xl" : "max-md:self-stretch", right && "flex flex-col items-end")}>
        {eyebrow ? (
          <Eyebrow light={light} centered={centered} right={right}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading
          className={cn(
            "font-display text-balance font-bold leading-[1.12]",
            right ? "text-right" : !centered && "text-left",
            Heading === "h1" ? "text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]" : "text-[clamp(1.85rem,3.6vw,2.75rem)]",
            light ? "text-ivory-100" : "text-navy-900",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-pretty text-base leading-relaxed md:text-lg",
              right && "self-stretch md:self-end md:text-right",
              light ? "text-ivory-100/75" : "text-ink-500",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline",
            light ? "text-gold-300" : "text-navy-900",
          )}
        >
          {action.label}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
