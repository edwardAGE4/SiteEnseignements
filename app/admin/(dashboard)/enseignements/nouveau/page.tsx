import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { emptyResourceDefaults } from "@/lib/resource-defaults";
import { TypeIcon } from "@/components/ui/Icons";
import { isResourceType, SECTION_LIST, TYPE_LABELS } from "@/lib/sections";
import { createTeaching } from "../actions";

export const metadata: Metadata = {
  title: "Nouvelle ressource",
  robots: { index: false, follow: false },
};

export default async function NewResourcePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;

  // etape 1 : choix du type de ressource
  if (!isResourceType(type)) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Nouvelle ressource</h1>
          <p className="mt-1 text-sm text-ink-500">Quel type de ressource souhaitez-vous ajouter ?</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SECTION_LIST.map((section) => (
            <li key={section.type}>
              <Link
                href={`/admin/enseignements/nouveau?type=${section.type}`}
                className="flex h-full items-start gap-4 rounded-2xl border border-ink-900/10 bg-ivory-50 p-5 transition-colors hover:border-navy-900"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300">
                  <TypeIcon type={section.type} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-navy-900">{section.singular}</span>
                  <span className="mt-1 block text-sm text-ink-500">{section.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, isActive: true } });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/enseignements/nouveau" className="text-xs text-ink-500 hover:underline">
          ← Changer de type
        </Link>
        <h1 className="mt-2 font-display text-2xl font-medium text-navy-900">Nouvelle ressource : {TYPE_LABELS[type].toLowerCase()}</h1>
        <p className="mt-1 text-sm text-ink-500">Les champs marqués d&apos;un astérisque sont obligatoires.</p>
      </div>

      <ResourceForm categories={categories} defaults={emptyResourceDefaults(type)} action={createTeaching} isCreation />
    </div>
  );
}
