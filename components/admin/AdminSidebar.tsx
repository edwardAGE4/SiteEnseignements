"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/enseignements", label: "Enseignements" },
  { href: "/admin/categories", label: "Categories" },
];

const ADMIN_ONLY_LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/parametres", label: "Parametres" },
];

export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ...ADMIN_ONLY_LINKS] : LINKS;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-ink-900/10 bg-ivory-50 md:block">
      <div className="sticky top-0 flex h-screen flex-col justify-between p-6">
        <div>
          <Link href="/admin" className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-navy-900">
            Espace admin
          </Link>

          <nav className="mt-10 flex flex-col gap-1">
            {links.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 font-data text-sm font-medium transition-colors",
                    active ? "bg-navy-900 text-ivory-100" : "text-ink-700 hover:bg-ink-900/5",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link href="/" className="font-data text-xs text-ink-300 hover:text-navy-900">
          ← Retour au site public
        </Link>
      </div>
    </aside>
  );
}
