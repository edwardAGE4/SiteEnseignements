"use client";

import { useState, useTransition } from "react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormAlerts } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { cn, isInteractiveClick, matchesSearch } from "@/lib/utils";
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
  imageUrl: string | null;
  isActive: boolean;
  resourceCount: number;
  publishedCount: number;
};

export function CategoryList({ categories }: { categories: CategoryItem[] }) {
  const [prevCategories, setPrevCategories] = useState(categories);
  const [items, setItems] = useState(categories);
  const [query, setQuery] = useState("");
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

  const searching = query.trim().length > 0;
  const visible = items.filter((category) =>
    matchesSearch(query, [category.name, category.slug, category.description]),
  );

  function startEditing(id: string) {
    setNotice(undefined);
    setEditingId(id);
  }

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Rechercher une catégorie"
        resultLabel={`${visible.length} résultat${visible.length > 1 ? "s" : ""} · réordonnancement désactivé pendant la recherche`}
      />
      <FormAlerts state={notice} />
      {visible.length === 0 ? (
        <EmptyState title={searching ? "Aucune catégorie trouvée" : "Aucune catégorie pour le moment"} />
      ) : (
        <ul className="divide-y divide-ink-900/10 rounded-2xl border border-ink-900/10 bg-ivory-50">
          {visible.map((category, index) => {
            const editing = editingId === category.id;
            // glisser-deposer seulement sur la liste complete (index = position reelle)
            const draggable = !searching && !editing;
            return (
              <li
                key={category.id}
                draggable={draggable}
                onDragStart={draggable ? () => setDragIndex(index) : undefined}
                onDragOver={draggable ? (event) => event.preventDefault() : undefined}
                onDrop={draggable ? () => handleDrop(index) : undefined}
                onClick={editing ? undefined : (event) => {
                  if (!isInteractiveClick(event)) startEditing(category.id);
                }}
                className={cn("px-5 py-4", !editing && "cursor-pointer transition-colors hover:bg-ivory-200")}
              >
                {editing ? (
                  <div className="space-y-3">
                    <CategoryForm
                      action={updateCategory.bind(null, category.id)}
                      defaults={{
                        name: category.name,
                        slug: category.slug,
                        description: category.description ?? "",
                        imageUrl: category.imageUrl ?? "",
                        isActive: category.isActive,
                      }}
                      submitLabel="Mettre à jour"
                      onSuccess={(result) => {
                        setNotice(result);
                        setEditingId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="font-data text-sm text-ink-500 hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {searching ? null : (
                      <span className="cursor-grab select-none text-ink-300" aria-hidden title="Glisser pour réordonner">
                        ⠿
                      </span>
                    )}
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate font-medium text-navy-900">
                        {category.name}
                        {category.isActive ? null : (
                          <span className="ml-2 rounded-full bg-ink-900/5 px-2 py-0.5 text-xs font-normal text-ink-700">Masquée</span>
                        )}
                      </p>
                      {category.description ? (
                        <p className="truncate text-sm text-ink-500">{category.description}</p>
                      ) : null}
                    </div>
                    <span className="font-data text-xs text-ink-500">
                      {category.resourceCount} ressource{category.resourceCount > 1 ? "s" : ""} · {category.publishedCount} publiée
                      {category.publishedCount > 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => startEditing(category.id)}
                        className="font-data text-xs font-medium text-navy-900 hover:underline"
                      >
                        Modifier
                      </button>
                      <ConfirmDialog
                        triggerLabel="Supprimer"
                        title="Supprimer cette catégorie ?"
                        description={
                          category.resourceCount > 0
                            ? `Cette catégorie contient ${category.resourceCount} ressource(s). Les ressources sont conservées : seule la catégorie leur est retirée.`
                            : "Cette action est irréversible."
                        }
                        confirmLabel="Supprimer"
                        action={() => deleteCategory(category.id)}
                        onDone={(result) => setNotice(result ?? undefined)}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
