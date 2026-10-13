"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormAlerts } from "@/components/ui/Alert";
import { SearchInput } from "@/components/admin/SearchInput";
import { TeachingRowActions } from "@/components/admin/TeachingRowActions";
import { isInteractiveClick, matchesSearch } from "@/lib/utils";

export type TeachingRow = {
  id: string;
  title: string;
  slug: string;
  type: string;
  typeLabel: string;
  publicPath: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  featured: boolean;
  categories: string;
  tags: string[];
  date: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  author: string;
};

const STATUS_SEARCH: Record<TeachingRow["status"], string> = {
  PUBLISHED: "publié",
  DRAFT: "brouillon",
  ARCHIVED: "archivé",
};

export function TeachingTable({ teachings }: { teachings: TeachingRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ error?: string; success?: string } | undefined>();

  const filtered = teachings.filter((teaching) =>
    matchesSearch(query, [
      teaching.title,
      teaching.slug,
      teaching.typeLabel,
      teaching.categories,
      teaching.author,
      teaching.tags.join(" "),
      STATUS_SEARCH[teaching.status],
    ]),
  );

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Rechercher (titre, type, catégorie, auteur, mot-clé…)"
        resultLabel={`${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
      />
      <FormAlerts state={notice} />

      {filtered.length === 0 ? (
        <EmptyState title="Aucune ressource trouvée" description="Essayez un autre mot-clé." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/10 bg-ivory-50">
          <table className="w-full text-left text-sm lg:min-w-[900px]">
            <thead>
              <tr className="border-b border-ink-900/10 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3 font-medium">Titre</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Type</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Statut</th>
                <th className="hidden px-5 py-3 font-medium xl:table-cell">Catégorie</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Date</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Vues</th>
                <th className="hidden px-5 py-3 font-medium xl:table-cell">Téléch.</th>
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
                    <td className="max-w-[280px] px-5 py-4">
                      <Link href={editHref} className="block truncate font-medium text-navy-900 hover:underline">
                        {teaching.title}
                      </Link>
                      {teaching.featured ? <span className="text-xs text-gold-700">★ Mis en avant</span> : null}
                      {/* sur mobile, les colonnes masquees sont resumees sous le titre */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                        <StatusBadge status={teaching.status} />
                        <span className="text-xs text-ink-500">{teaching.typeLabel}</span>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 text-ink-700 md:table-cell">{teaching.typeLabel}</td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <StatusBadge status={teaching.status} />
                    </td>
                    <td className="hidden max-w-[180px] truncate px-5 py-4 text-ink-500 xl:table-cell">{teaching.categories || "—"}</td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.date}</td>
                    <td className="hidden px-5 py-4 text-ink-500 lg:table-cell">{teaching.viewCount}</td>
                    <td className="hidden px-5 py-4 text-ink-500 xl:table-cell">{teaching.downloadCount}</td>
                    <td className="px-5 py-4">
                      <TeachingRowActions
                        id={teaching.id}
                        status={teaching.status}
                        publicPath={teaching.publicPath}
                        onResult={setNotice}
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
