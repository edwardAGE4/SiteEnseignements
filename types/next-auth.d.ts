import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "EDITOR";
    /** version de session du compte au moment de la connexion (voir lib/auth.ts) */
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EDITOR";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "EDITOR";
    /** version de session : si elle change en base, la session est revoquee */
    sv?: number;
    /** derniere reverification du compte en base (ms) */
    checkedAt?: number;
  }
}
