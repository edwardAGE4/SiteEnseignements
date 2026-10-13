import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SECTION_LIST } from "@/lib/sections";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenu" className="flex-1">
        <Container className="flex flex-col items-center py-24 text-center md:py-32">
          <p className="font-display text-7xl font-light text-gold-500">404</p>
          <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] font-medium text-navy-900">
            Cette page est introuvable
          </h1>
          <p className="mt-4 max-w-md text-ink-500">
            La ressource a peut-être été déplacée ou retirée. Vous pouvez poursuivre votre visite depuis
            l&apos;une des rubriques ci-dessous.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/">Retour à l&apos;accueil</Button>
            <Button href="/recherche" variant="outline">
              Rechercher une ressource
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {SECTION_LIST.map((section) => (
              <li key={section.section}>
                <Link href={section.path} className="font-semibold text-navy-900 underline-offset-4 hover:underline">
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  );
}
