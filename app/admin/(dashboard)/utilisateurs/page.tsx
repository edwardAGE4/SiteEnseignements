import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-role";
import { UserForm } from "@/components/admin/UserForm";
import { UserList } from "@/components/admin/UserList";
import { createUser } from "./actions";

export const metadata: Metadata = {
  title: "Utilisateurs",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Utilisateurs</h1>
        <p className="mt-1 text-sm text-ink-500">Réservé aux administrateurs.</p>
      </div>

      <div className="rounded-2xl border border-ink-900/10 bg-ivory-50 p-6">
        <h2 className="font-display text-lg font-semibold text-navy-900">Nouvel utilisateur</h2>
        <div className="mt-4">
          <UserForm mode="create" action={createUser} />
        </div>
      </div>

      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
