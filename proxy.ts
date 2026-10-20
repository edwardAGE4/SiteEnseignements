import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminCsp } from "@/lib/security/csp";

const ADMIN_ONLY_PREFIXES = ["/admin/utilisateurs", "/admin/parametres"];
const PUBLIC_ADMIN_PATHS = ["/admin/connexion"];

/**
 * Administration : controle d'acces (connexion, roles) et CSP stricte a
 * nonce. Next lit le nonce dans l'en-tete Content-Security-Policy de la
 * requete et l'ajoute a ses propres scripts.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const nonce = btoa(crypto.randomUUID());
  const csp = adminCsp(nonce);

  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  if (!PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    const session = req.auth;

    if (!session?.user) {
      const loginUrl = new URL("/admin/connexion", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withCsp(NextResponse.redirect(loginUrl));
    }

    if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && session.user.role !== "ADMIN") {
      return withCsp(NextResponse.redirect(new URL("/admin", req.nextUrl.origin)));
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
});

export const config = {
  matcher: ["/admin/:path*"],
};
