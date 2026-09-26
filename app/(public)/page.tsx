import type { Metadata } from "next";
import { Hero } from "@/components/public/Hero";
import { AboutSection } from "@/components/public/AboutSection";
import { QuoteSection } from "@/components/public/QuoteSection";
import { TeachingGrid } from "@/components/public/TeachingGrid";
import { CategoryCard } from "@/components/public/CategoryCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { getLatestTeachings } from "@/lib/teachings";
import { listCategoriesWithCounts } from "@/lib/categories";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [latestTeachings, categories] = await Promise.all([
    getLatestTeachings(3),
    listCategoriesWithCounts(),
  ]);

  return (
    <>
      <Hero />

      <AboutSection />

      <section className="bg-ivory-100 py-28">
        <Container>
          <SectionHeading eyebrow="Enseignements récents" title="La parole qui transforme" />

          <div className="mt-16">
            <TeachingGrid teachings={latestTeachings} />
          </div>

          <div className="mt-14 flex justify-center">
            <Button href="/enseignements" variant="outline">
              Explorer tous les enseignements
            </Button>
          </div>
        </Container>
      </section>

      <QuoteSection quote="Une parole qui transforme commence souvent par une compréhension nouvelle." />

      {categories.length > 0 ? (
        <section className="bg-ivory-200 py-28">
          <Container>
            <SectionHeading eyebrow="Thématiques" title="Choisissez votre chemin" />
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="bg-navy-950 py-24">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-balance text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold text-ivory-100">
            Toute la bibliothèque d&apos;enseignements
          </h2>
          <p className="max-w-lg text-justify hyphens-auto text-ivory-100/70 md:text-center">
            Vidéos, audios et documents — retrouvez l&apos;ensemble des enseignements
            disponibles, classés et filtrables.
          </p>
          <Button href="/enseignements" variant="gold">
            Explorer tous les enseignements
          </Button>
        </Container>
      </section>
    </>
  );
}
