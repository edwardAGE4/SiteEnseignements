import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

const authSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || undefined;

if (!authSecret && process.env.NODE_ENV === "production") {
  // Aide au diagnostic sur l'hebergeur : on liste uniquement les NOMS des
  // variables liees a l'authentification (jamais leurs valeurs).
  const authVariableNames = Object.keys(process.env).filter((name) => /AUTH|SECRET/i.test(name));
  console.error(
    `[auth] AUTH_SECRET absent ou vide dans cet environnement (${process.env.VERCEL_ENV ?? "inconnu"}). ` +
      `Variables detectees : ${authVariableNames.join(", ") || "aucune"}. ` +
      "Ajoutez AUTH_SECRET dans les variables d'environnement de l'hebergeur puis redeployez.",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        // Freine les tentatives repetees de connexion (protection brute-force basique)
        if (isRateLimited(`login:${email}`, 2_000)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EDITOR";
      }
      return session;
    },
  },
});
