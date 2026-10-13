"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { SearchIcon } from "@/components/ui/Icons";
import { NAV_LINKS, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // le menu mobile se referme a chaque changement de page
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const closeOnDesktop = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closeOnDesktop);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closeOnDesktop);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const searchActive = isActive(pathname, "/recherche");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-ivory-100/95 backdrop-blur-sm transition-[border-color,box-shadow] duration-300 supports-[backdrop-filter]:bg-ivory-100/85",
        scrolled || menuOpen ? "border-navy-900/10 shadow-[0_8px_24px_-20px_rgba(20,38,61,0.5)]" : "border-transparent",
      )}
    >
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-[1.35rem] font-bold tracking-[-0.02em] text-navy-900 md:text-2xl"
          aria-label={`${SITE_NAME} — Accueil`}
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 font-display text-base font-semibold tracking-[-0.01em] transition-colors",
                  active ? "text-navy-900" : "text-ink-700 hover:text-navy-900",
                  "after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold-500 after:transition-transform after:duration-300",
                  active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/recherche"
            aria-label="Rechercher une ressource"
            aria-current={searchActive ? "page" : undefined}
            className={cn(
              "ml-2 flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
              searchActive
                ? "border-navy-900 bg-navy-900 text-ivory-100"
                : "border-navy-900/15 text-navy-900 hover:border-navy-900",
            )}
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/recherche"
            aria-label="Rechercher une ressource"
            className="flex h-11 w-11 items-center justify-center rounded-full text-navy-900 hover:bg-navy-900/5"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full hover:bg-navy-900/5"
          >
            <span className={cn("block h-[1.5px] w-6 bg-navy-900 transition-transform", menuOpen && "translate-y-[7.5px] rotate-45")} />
            <span className={cn("block h-[1.5px] w-6 bg-navy-900 transition-opacity", menuOpen && "opacity-0")} />
            <span className={cn("block h-[1.5px] w-6 bg-navy-900 transition-transform", menuOpen && "-translate-y-[7.5px] -rotate-45")} />
          </button>
        </div>
      </Container>

      <div
        id="menu-mobile"
        hidden={!menuOpen}
        className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-navy-900/10 bg-ivory-100 lg:hidden"
      >
        <Container>
          <nav aria-label="Navigation mobile" className="flex flex-col py-6">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between border-b border-navy-900/10 py-4 font-display text-2xl transition-colors",
                    active ? "text-navy-900" : "text-ink-700 hover:text-navy-900",
                  )}
                >
                  {link.label}
                  {active ? <span aria-hidden className="h-2 w-2 rounded-full bg-gold-500" /> : null}
                </Link>
              );
            })}
          </nav>
        </Container>
      </div>
    </header>
  );
}
