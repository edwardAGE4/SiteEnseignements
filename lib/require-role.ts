import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/connexion");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }
  return session;
}
