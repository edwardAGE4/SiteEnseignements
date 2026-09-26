import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TeachingForm } from "@/components/admin/TeachingForm";
import { createTeaching } from "../actions";

export const metadata: Metadata = {
  title: "Nouvel enseignement",
  robots: { index: false, follow: false },
};

export default async function NewTeachingPage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Nouvel enseignement</h1>
        <p className="mt-1 text-sm text-ink-500">Remplissez les informations puis enregistrez.</p>
      </div>

      <TeachingForm categories={categories} action={createTeaching} submitLabel="Créer l'enseignement" />
    </div>
  );
}
