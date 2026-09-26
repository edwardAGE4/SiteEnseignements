"use client";

import { useState } from "react";
import { UserForm } from "@/components/admin/UserForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { FormAlerts } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { cn, isInteractiveClick, matchesSearch } from "@/lib/utils";
import { updateUser, deleteUser, type UserFormState } from "@/app/admin/(dashboard)/utilisateurs/actions";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  isActive: boolean;
};

export function UserList({ users, currentUserId }: { users: UserItem[]; currentUserId: string }) {
  const [prevUsers, setPrevUsers] = useState(users);
  const [items, setItems] = useState(users);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<UserFormState>(undefined);

  if (users !== prevUsers) {
    setPrevUsers(users);
    setItems(users);
  }

  const visible = items.filter((user) =>
    matchesSearch(query, [
      user.name,
      user.email,
      user.role === "ADMIN" ? "administrateur" : "éditeur",
      user.isActive ? "actif" : "désactivé",
    ]),
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
        placeholder="Rechercher un utilisateur (nom, e-mail, rôle...)"
        resultLabel={`${visible.length} résultat${visible.length > 1 ? "s" : ""}`}
      />
      <FormAlerts state={notice} />
      {visible.length === 0 ? (
        <EmptyState title="Aucun utilisateur trouvé" description="Essayez un autre mot-clé." />
      ) : (
        <ul className="divide-y divide-ink-900/10 rounded-2xl border border-ink-900/10 bg-ivory-50">
          {visible.map((user) => {
            const editing = editingId === user.id;
            return (
              <li
                key={user.id}
                onClick={editing ? undefined : (event) => {
                  if (!isInteractiveClick(event)) startEditing(user.id);
                }}
                className={cn("px-5 py-4", !editing && "cursor-pointer transition-colors hover:bg-ivory-200")}
              >
                {editing ? (
                  <div className="space-y-3">
                    <UserForm
                      mode="edit"
                      action={updateUser.bind(null, user.id)}
                      defaults={{ name: user.name, email: user.email, role: user.role, isActive: user.isActive }}
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
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-medium text-navy-900">
                        {user.name} {user.id === currentUserId ? <span className="text-ink-300">(vous)</span> : null}
                      </p>
                      <p className="truncate text-sm text-ink-500">{user.email}</p>
                    </div>
                    <span className="font-data text-xs text-ink-500">
                      {user.role === "ADMIN" ? "Administrateur" : "Éditeur"}
                    </span>
                    <span className={cn("font-data text-xs", user.isActive ? "text-emerald-700" : "text-ink-300")}>
                      {user.isActive ? "Actif" : "Désactivé"}
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => startEditing(user.id)}
                        className="font-data text-xs font-medium text-navy-900 hover:underline"
                      >
                        Modifier
                      </button>
                      {user.id !== currentUserId ? (
                        <ConfirmDialog
                          triggerLabel="Supprimer"
                          title="Supprimer cet utilisateur ?"
                          description="Si cet utilisateur a déjà publié des enseignements, désactivez-le plutôt que de le supprimer."
                          confirmLabel="Supprimer"
                          action={() => deleteUser(user.id)}
                        />
                      ) : null}
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
