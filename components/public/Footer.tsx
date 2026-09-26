import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-ivory-100/80">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-lg font-semibold text-ivory-100">
            Pasteur Jean-Marc GNALI
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-ivory-100/70">
            Une plateforme dédiée aux enseignements du Pasteur Jean-Marc GNALI —
            pour comprendre, grandir et transmettre.
          </p>
        </div>

        <div className="space-y-4">
          <p className="font-accent text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
            Navigation
          </p>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/enseignements" className="hover:text-gold-300">Enseignements</Link>
            <Link href="/categories" className="hover:text-gold-300">Catégories</Link>
            <Link href="/a-propos" className="hover:text-gold-300">À propos</Link>
          </nav>
        </div>

        <div className="space-y-4">
          <p className="font-accent text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
            Informations
          </p>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/mentions-legales" className="hover:text-gold-300">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-gold-300">Politique de confidentialité</Link>
            <Link href="/admin" className="hover:text-gold-300">Espace administrateur</Link>
          </nav>
        </div>
      </Container>

      <div className="border-t border-ivory-100/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-ivory-100/50 md:flex-row">
          <p>© {new Date().getFullYear()} Pasteur Jean-Marc GNALI. Tous droits réservés.</p>
          <p>Enseignements — Foi — Transmission</p>
        </Container>
      </div>
    </footer>
  );
}
