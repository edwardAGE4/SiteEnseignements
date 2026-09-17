import { requireSession } from "@/lib/require-role";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
      <div className="flex-1">
        <AdminHeader name={session.user.name ?? session.user.email ?? ""} role={session.user.role} />
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
