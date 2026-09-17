"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/enseignements", label: "Enseignements" },
  { href: "/categories", label: "Categories" },
  { href: "/a-propos", label: "A propos" },
];

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [prevIsHome, setPrevIsHome] = useState(isHome);
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);

  if (isHome !== prevIsHome) {
    setPrevIsHome(isHome);
    setScrolled(!isHome);
  }

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled && !menuOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent py-6"
          : "bg-navy-900/95 py-4 shadow-[0_1px_0_rgba(212,181,116,0.15)] backdrop-blur",
      )}
    >
      <Container className="flex items-center justify-between">
        <Link href="/" className="font-display text-sm font-semibold uppercase tracking-[0.25em] text-ivory-100">
          Pasteur Jean-Marc GNALI
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-accent text-sm font-medium tracking-wide text-ivory-100/90 transition-colors hover:text-gold-300"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/enseignements"
            className="rounded-full border border-gold-400/60 px-5 py-2 font-accent text-sm font-medium text-gold-300 transition-colors hover:bg-gold-500 hover:text-navy-950"
          >
            Rechercher
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={cn(
              "block h-px w-6 bg-ivory-100 transition-transform",
              menuOpen && "translate-y-[7px] rotate-45",
            )}
          />
          <span
            className={cn("block h-px w-6 bg-ivory-100 transition-opacity", menuOpen && "opacity-0")}
          />
          <span
            className={cn(
              "block h-px w-6 bg-ivory-100 transition-transform",
              menuOpen && "-translate-y-[7px] -rotate-45",
            )}
          />
        </button>
      </Container>

      {menuOpen ? (
        <Container className="md:hidden">
          <nav className="mt-6 flex flex-col gap-1 border-t border-ivory-100/10 pt-6 pb-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-3 font-accent text-base text-ivory-100 hover:bg-ivory-100/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Container>
      ) : null}
    </header>
  );
}
