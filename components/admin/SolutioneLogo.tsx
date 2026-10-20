"use client";

import { useState } from "react";
import { AppIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const VARIANTS = [
  // version claire sur theme clair, sombre sur theme sombre : bascule en CSS (variante dark:), sans attendre JS
  { key: "light", src: "/brand/solutione-clair.png", className: "block dark:hidden" },
  { key: "dark", src: "/brand/solutione-sombre.png", className: "hidden dark:block" },
] as const;

/**
 * Logo Solutione adapte au theme. Si une image ne se charge pas, une icone
 * neutre la remplace.
 */
export function SolutioneLogo({ alt, className }: { alt: string; className?: string }) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  return (
    <>
      {VARIANTS.map((variant) =>
        failed[variant.key] ? (
          <span
            key={variant.key}
            role="img"
            aria-label={alt}
            className={cn(variant.className, "flex aspect-[6/5] items-center justify-center", className)}
          >
            <AppIcon className="m-auto h-12 w-12 text-ink-500" />
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- image statique deja optimisee (480 px)
          <img
            key={variant.key}
            src={variant.src}
            alt={alt}
            width={480}
            height={400}
            onError={() => setFailed((current) => ({ ...current, [variant.key]: true }))}
            className={cn(variant.className, "h-auto", className)}
          />
        ),
      )}
    </>
  );
}
