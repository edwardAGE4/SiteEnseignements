import { connection } from "next/server";

/**
 * Toute l'administration est rendue a chaque requete : indispensable pour
 * que Next applique le nonce de la CSP (proxy.ts) a ses scripts, y compris
 * sur la page de connexion.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}
