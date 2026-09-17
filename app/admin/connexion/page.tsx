import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — Espace administrateur",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-ivory-100 p-10 shadow-2xl">
        <p className="font-accent text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          Espace administrateur
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-navy-900">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Reservee aux administrateurs et editeurs de la plateforme.
        </p>

        <div className="mt-8">
          <LoginForm callbackUrl={callbackUrl || "/admin"} />
        </div>
      </div>
    </div>
  );
}
