import { signOut } from "@/lib/auth";

export function AdminHeader({ name, role }: { name: string; role: string }) {
  return (
    <header className="flex items-center justify-between border-b border-ink-900/10 bg-ivory-100 px-6 py-4 md:px-10">
      <div>
        <p className="font-data text-sm font-medium text-navy-900">{name}</p>
        <p className="font-data text-xs text-ink-300">{role === "ADMIN" ? "Administrateur" : "Editeur"}</p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/admin/connexion" });
        }}
      >
        <button
          type="submit"
          className="rounded-full border border-ink-900/15 px-4 py-2 font-data text-xs font-medium text-ink-700 hover:border-navy-900"
        >
          Se deconnecter
        </button>
      </form>
    </header>
  );
}
