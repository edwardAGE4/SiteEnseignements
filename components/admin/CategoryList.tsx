"use client";

import { useState, useTransition } from "react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormAlerts } from "@/components/ui/Alert";
import {
  updateCategory,
  deleteCategory,
  reorderCategories,
  type CategoryFormState,
} from "@/app/admin/(dashboard)/categories/actions";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  teachingCount: number;
};

export function CategoryList({ categories }: { categories: CategoryItem[] }) {
  const [prevCategories, setPrevCategories] = useState(categories);
  const [items, setItems] = useState(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<CategoryFormState>(undefined);
  const [, startTransition] = useTransition();

  if (categories !== prevCategories) {
    setPrevCategories(categories);
    setItems(categories);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setItems(next);
    setDragIndex(null);
    startTransition(() => {
      reorderCategories(next.map((item) => item.id));
    });
  }

  return (
    <div className="space-y-4">
      <FormAlerts state={notice} />
      <ul className="divide-y divide-ink-900/10 rounded-2xl border border-ink-900/10 bg-ivory-50">
        {items.map((category, index) => (
          <li
            key={category.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="px-5 py-4"
          >
            {editingId === category.id ? (
              <CategoryForm
                action={updateCategory.bind(null, category.id)}
                defaults={{ name: category.name, slug: category.slug, description: category.description ?? "" }}
                submitLabel="Mettre a jour"
                onSuccess={(result) => {
                  setNotice(result);
                  setEditingId(null);
                }}
              />
            ) : (
              <div className="flex items-center gap-4">
                <span className="cursor-grab select-none text-ink-300" aria-hidden title="Glisser pour reordonner">
                  ⠿
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy-900">{category.name}</p>
                  {category.description ? (
                    <p className="truncate text-sm text-ink-500">{category.description}</p>
                  ) : null}
                </div>
                <span className="font-data text-xs text-ink-300">
                  {category.teachingCount} enseignement{category.teachingCount > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotice(undefined);
                    setEditingId(category.id);
                  }}
                  className="font-data text-xs font-medium text-navy-900 hover:underline"
                >
                  Modifier
                </button>
                <ConfirmDialog
                  triggerLabel="Supprimer"
                  title="Supprimer cette categorie ?"
                  description={
                    category.teachingCount > 0
                      ? `Cette categorie contient ${category.teachingCount} enseignement(s). La suppression retirera cette categorie de ces enseignements.`
                      : "Cette action est irreversible."
                  }
                  confirmLabel="Supprimer"
                  action={() => deleteCategory(category.id)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
