"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";

const ABOUT_HREF = "/admin/a-propos";

/** Lien « À propos » + version, en pied des menus (bureau et mobile). */
function AboutLink({ className, activeClassName, idleClassName }: { className: string; activeClassName: string; idleClassName: string }) {
  const active = usePathname() === ABOUT_HREF;
  return (
    <Link href={ABOUT_HREF} aria-current={active ? "page" : undefined} className={cn(className, active ? activeClassName : idleClassName)}>
      {t.about.navLabel}
      <span className="text-xs font-normal opacity-70">v{APP_VERSION}</span>
    </Link>
  );
}

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/enseignements", label: "Ressources" },
  { href: "/admin/categories", label: "Catégories" },
];

const ADMIN_ONLY_LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/parametres", label: "Paramètres" },
];

function useAdminLinks(isAdmin: boolean) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ...ADMIN_ONLY_LINKS] : LINKS;
  return links.map((link) => ({
    ...link,
    active: link.exact ? pathname === link.href : pathname.startsWith(link.href),
  }));
}

export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  const links = useAdminLinks(isAdmin);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-ink-900/10 bg-ivory-50 md:block">
      <div className="sticky top-0 flex h-screen flex-col p-6">
        <div>
          <Link href="/admin" className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-navy-900">
            Espace admin
          </Link>

          <nav className="mt-10 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 font-data text-sm font-medium transition-colors",
                  link.active ? "bg-navy-900 text-ivory-100" : "text-ink-700 hover:bg-ink-900/5",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Pied de menu, pousse tout en bas */}
        <div className="mt-auto space-y-3 border-t border-ink-900/10 pt-4">
          <AboutLink
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 font-data text-sm font-medium transition-colors"
            activeClassName="bg-navy-900 text-ivory-100"
            idleClassName="text-ink-700 hover:bg-ink-900/5"
          />
          <Link href="/" className="block px-3 font-data text-xs text-ink-300 hover:text-navy-900">
            ← Retour au site public
          </Link>
        </div>
      </div>
    </aside>
  );
}

/** Navigation de l'admin sur mobile (la barre laterale y est masquee) : onglets defilants. */
export function AdminMobileNav({ isAdmin }: { isAdmin: boolean }) {
  const links = useAdminLinks(isAdmin);

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-ink-900/10 bg-ivory-50 px-4 py-3 md:hidden">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.active ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 font-data text-sm font-medium transition-colors",
            link.active ? "bg-navy-900 text-ivory-100" : "text-ink-700 hover:bg-ink-900/5",
          )}
        >
          {link.label}
        </Link>
      ))}
      <AboutLink
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-data text-sm font-medium transition-colors"
        activeClassName="bg-navy-900 text-ivory-100"
        idleClassName="text-ink-700 hover:bg-ink-900/5"
      />
      <Link href="/" className="shrink-0 rounded-full px-4 py-2 font-data text-sm text-ink-300 hover:text-navy-900">
        Site public
      </Link>
    </nav>
  );
}
