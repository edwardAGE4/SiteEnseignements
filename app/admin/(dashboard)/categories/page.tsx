import type { Metadata } from "next";
import { listCategoriesWithCounts } from "@/lib/categories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { CategoryList } from "@/components/admin/CategoryList";
import { createCategory } from "./actions";

export const metadata: Metadata = {
  title: "Catégories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Catégories</h1>
        <p className="mt-1 text-sm text-ink-500">
          Glissez-déposez une catégorie pour modifier son ordre d&apos;affichage.
        </p>
      </div>

      <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-900">Nouvelle catégorie</h2>
        <div className="mt-4">
          <CategoryForm action={createCategory} submitLabel="Créer la catégorie" />
        </div>
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
