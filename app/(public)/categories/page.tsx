import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/public/CategoryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCategoriesWithCounts } from "@/lib/categories";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Catégories",
  description: "Parcourez les grandes thématiques des enseignements du Pasteur Jean-Marc GNALI.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div className="pt-32 pb-28">
      <Container>
        <SectionHeading eyebrow="Thématiques" title="Choisissez votre chemin" />

        <div className="mt-16">
          {categories.length === 0 ? (
            <EmptyState title="Aucune catégorie pour le moment" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
