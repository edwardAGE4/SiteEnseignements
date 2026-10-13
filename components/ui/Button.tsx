import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-navy-900 text-ivory-100 hover:bg-navy-700",
  outline: "border border-navy-900/25 text-navy-900 hover:border-navy-900 hover:bg-navy-900/[0.03]",
  /** bouton sur fond sombre */
  ghost: "border border-ivory-100/35 text-ivory-100 hover:border-ivory-100 hover:bg-ivory-100/10",
  gold: "bg-gold-500 text-navy-950 hover:bg-gold-400",
  link: "px-0! py-0! text-navy-900 underline-offset-4 hover:underline",
};

const SIZES = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-12 px-6 py-3 text-base",
};

type SizeKey = keyof typeof SIZES;
type VariantKey = keyof typeof VARIANTS;

/** Classes d'un bouton, pour les styler sur un element qui n'est pas <Button> (ex. <a> externe). */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: { variant?: VariantKey; size?: SizeKey; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type CommonProps = {
  variant?: VariantKey;
  size?: SizeKey;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, "href" | "className">;

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = buttonClassName({ variant, size, className });

  if ("href" in props && props.href) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
