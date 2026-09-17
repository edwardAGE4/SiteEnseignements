import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-navy-900 text-ivory-100 hover:bg-navy-800 focus-visible:outline-navy-900",
  outline:
    "border border-ink-900/20 text-ink-900 hover:border-navy-900 hover:text-navy-900 focus-visible:outline-navy-900",
  ghost:
    "text-ivory-100 hover:text-gold-300 focus-visible:outline-ivory-100",
  gold:
    "bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:outline-gold-500",
};

const SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm md:text-base",
};

type CommonProps = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
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
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

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
