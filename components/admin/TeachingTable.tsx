"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { TeachingRowActions } from "@/components/admin/TeachingRowActions";
import { isInteractiveClick, matchesSearch } from "@/lib/utils";

export type TeachingRow = {
  id: string;
  title: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT";
  categories: string;
  tags: string[];
  date: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  author: string;
};

export function TeachingTable({
  teachings,
  onTogglePublish,
  onDelete,
}: {
  teachings: TeachingRow[];
  onTogglePublish: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = teachings.filter((teaching) =>
    matchesSearch(query, [
      teaching.title,
      teaching.slug,
      teaching.categories,
      teaching.author,
      teaching.tags.join(" "),
      teaching.status === "PUBLISHED" ? "publié" : "brouillon",
    ]),
  );

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Rechercher un enseignement (titre, catégorie, auteur, tag...)"
        resultLabel={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Aucun enseignement trouvé" description="Essayez un autre mot-clé." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/10 bg-ivory-50">
          <table className="w-full text-left text-sm lg:min-w-[840px]">
            <thead>
              <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-300">
                <th className="px-5 py-3 font-medium">Titre</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Catégorie</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Statut</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Date</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Vues</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Téléch.</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">J&apos;aime</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Auteur</th>
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {filtered.map((teaching) => {
                const editHref = `/admin/enseignements/${teaching.id}/modifier`;
                return (
                  <tr
                    key={teaching.id}
                    onClick={(event) => {
                      if (!isInteractiveClick(event)) router.push(editHref);
                    }}
                    className="cursor-pointer transition-colors hover:bg-ivory-200"
                  >
                    <td className="max-w-[240px] px-5 py-4">
                      <Link href={editHref} className="block truncate font-medium text-navy-900 hover:underline">
                        {teaching.title}
                      </Link>
                      {/* sur mobile, les colonnes masquees sont resumees sous le titre */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                        <StatusBadge status={teaching.status} />
                        <span className="truncate text-xs text-ink-500">{teaching.categories || "—"}</span>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 text-ink-500 md:table-cell">{teaching.categories || "—"}</td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <StatusBadge status={teaching.status} />
                    </td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.date}</td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.viewCount}</td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.downloadCount}</td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.likeCount}</td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.author}</td>
                    <td className="px-5 py-4">
                      <TeachingRowActions
                        id={teaching.id}
                        status={teaching.status}
                        onTogglePublish={onTogglePublish}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
