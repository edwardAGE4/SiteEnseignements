import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LEGAL_LINKS, NAV_LINKS, SITE_NAME } from "@/lib/site";
import { getSiteIdentitySafe } from "@/lib/settings";
import { InstagramIcon, YoutubeIcon } from "@/components/ui/Icons";

export async function Footer() {
  const identity = await getSiteIdentitySafe();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-900 text-ivory-100/80">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div className="space-y-4">
          <Link href="/" className="font-display text-2xl font-medium text-ivory-100">
            {SITE_NAME}
          </Link>
          {identity.intro ? (
            <p className="max-w-sm text-sm leading-relaxed text-ivory-100/70">{identity.intro}</p>
          ) : null}
          {identity.socials.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-2" aria-label="Réseaux sociaux">
              {identity.socials.map((social) => (
                <li key={social.key}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ivory-100/20 px-4 text-sm text-ivory-100/85 transition-colors hover:border-gold-400 hover:text-gold-300"
                  >
                    {social.key === "socialInstagram" ? <InstagramIcon className="h-4 w-4" /> : null}
                    {social.key === "socialYoutube" ? <YoutubeIcon className="h-4 w-4" /> : null}
                    {social.label}
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Navigation du pied de page" className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">Navigation</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1 hover:text-gold-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informations" className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">Informations</p>
          <ul className="space-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1 hover:text-gold-300">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/recherche" className="inline-block py-1 hover:text-gold-300">
                Rechercher une ressource
              </Link>
            </li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-ivory-100/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory-100/60 md:flex-row">
          <p>
            © {year} {SITE_NAME}. Tous droits réservés.
          </p>
          <Link href="/admin" className="hover:text-ivory-100" rel="nofollow">
            Espace administrateur
          </Link>
        </Container>
      </div>
    </footer>
  );
}
