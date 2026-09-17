"use client";

import { useState } from "react";
import { UserForm } from "@/components/admin/UserForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { updateUser, deleteUser } from "@/app/admin/(dashboard)/utilisateurs/actions";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  if (users !== prevUsers) {
    setPrevUsers(users);
    setItems(users);
  }

  return (
    <ul className="divide-y divide-ink-900/10 rounded-2xl border border-ink-900/10 bg-ivory-50">
      {items.map((user) => (
        <li key={user.id} className="px-5 py-4">
          {editingId === user.id ? (
            <UserForm
              mode="edit"
              action={updateUser.bind(null, user.id)}
              defaults={{ name: user.name, email: user.email, role: user.role, isActive: user.isActive }}
              onSuccess={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy-900">
                  {user.name} {user.id === currentUserId ? <span className="text-ink-300">(vous)</span> : null}
                </p>
                <p className="truncate text-sm text-ink-500">{user.email}</p>
              </div>
              <span className="font-data text-xs text-ink-500">
                {user.role === "ADMIN" ? "Administrateur" : "Editeur"}
              </span>
              <span
                className={`font-data text-xs ${user.isActive ? "text-emerald-700" : "text-ink-300"}`}
              >
                {user.isActive ? "Actif" : "Desactive"}
              </span>
              <button
                type="button"
                onClick={() => setEditingId(user.id)}
                className="font-data text-xs font-medium text-navy-900 hover:underline"
              >
                Modifier
              </button>
              {user.id !== currentUserId ? (
                <ConfirmDialog
                  triggerLabel="Supprimer"
                  title="Supprimer cet utilisateur ?"
                  description="Si cet utilisateur a deja publie des enseignements, desactivez-le plutot que de le supprimer."
                  confirmLabel="Supprimer"
                  action={() => deleteUser(user.id)}
                />
              ) : null}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
