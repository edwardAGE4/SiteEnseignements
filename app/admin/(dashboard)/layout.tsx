import { requireSession } from "@/lib/require-role";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen bg-ivory-100 font-data">
      <AdminSidebar isAdmin={session.user.role === "ADMIN"} />
      {/* min-w-0 : sans lui, un contenu large (tableau) elargit la page au-dela de l'ecran */}
      <div className="min-w-0 flex-1">
        <AdminHeader name={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
        <AdminMobileNav isAdmin={session.user.role === "ADMIN"} />
        <main className="p-4 sm:p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
