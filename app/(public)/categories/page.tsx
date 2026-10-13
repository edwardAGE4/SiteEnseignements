import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SafeImage } from "@/components/ui/SafeImage";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { listCategoriesInUse } from "@/lib/resources";
import { SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Thématiques",
  description: `Parcourez les ressources de ${SITE_NAME} par thématique.`,
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await listCategoriesInUse();

  return (
    <Container className="pt-10 pb-24 md:pt-14">
      <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Thématiques" }]} />
      <SectionHeading as="h1" className="mt-8" eyebrow="Thématiques" title="Parcourir par thème" />

      <div className="mt-12">
        {categories.length === 0 ? (
          <EmptyState title="Aucune thématique pour le moment" />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-navy-900/[0.07] transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(20,38,61,0.55)]"
                >
                  {category.imageUrl ? (
                    <div className="relative aspect-[16/9] bg-navy-900">
                      <SafeImage src={category.imageUrl} alt="" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-2xl font-medium text-navy-900">{category.name}</h2>
                    {category.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{category.description}</p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between pt-6 text-sm">
                      <span className="text-ink-500">
                        {category.resourceCount} ressource{category.resourceCount > 1 ? "s" : ""}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-navy-900 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
