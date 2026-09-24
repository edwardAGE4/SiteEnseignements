import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = ["/admin/utilisateurs", "/admin/parametres"];
const PUBLIC_ADMIN_PATHS = ["/admin/connexion"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/admin/connexion", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
