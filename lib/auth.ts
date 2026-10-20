import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, exceedsRate } from "@/lib/rate-limit";

const authSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || undefined;

if (!authSecret && process.env.NODE_ENV === "production") {
  // Aide au diagnostic sur l'hebergeur : on liste uniquement les NOMS des
  // variables liees a l'authentification (jamais leurs valeurs).
  const authVariableNames = Object.keys(process.env).filter((name) => /AUTH|SECRET/i.test(name));
  console.error(
    `[auth] AUTH_SECRET absent ou vide dans cet environnement (${process.env.VERCEL_ENV ?? "inconnu"}). ` +
      `Variables détectées : ${authVariableNames.join(", ") || "aucune"}. ` +
      "Ajoutez AUTH_SECRET dans les variables d'environnement de l'hébergeur puis redéployez.",
  );
}

/** Echecs consecutifs avant verrouillage, et duree du verrouillage. */
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
/** Duree d'une session d'administration. */
const SESSION_MAX_AGE_S = 8 * 60 * 60;
/** Frequence de reverification du compte en base (desactivation, role, mot de passe). */
const RECHECK_MS = 60 * 1000;

// Hash factice : un e-mail inconnu prend le meme temps qu'un mauvais mot de passe
// (on ne peut pas deviner quels comptes existent en mesurant le temps de reponse).
const DUMMY_HASH = bcrypt.hashSync("compte-inexistant", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_S, updateAge: 60 * 60 },
  pages: {
    signIn: "/admin/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase().slice(0, 254) : "";
        const password = typeof credentials?.password === "string" ? credentials.password.slice(0, 200) : "";

        if (!email || !password) return null;

        // Freine les essais en rafale depuis une meme adresse IP (toutes adresses e-mail confondues)
        if (exceedsRate(`login-ip:${clientIp(request.headers)}`, 20, 15 * 60 * 1000)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        // Compte verrouille apres trop d'echecs : refuse sans meme verifier le mot de passe
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          const failures = user.failedLoginCount + 1;
          await prisma.user.update({
            where: { id: user.id },
            data:
              failures >= MAX_FAILED_LOGINS
                ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCK_MS) }
                : { failedLoginCount: failures },
          });
          if (failures >= MAX_FAILED_LOGINS) {
            console.warn(`[auth] compte ${user.id} verrouille 15 min apres ${MAX_FAILED_LOGINS} echecs de connexion`);
          }
          return null;
        }

        if (user.failedLoginCount > 0 || user.lockedUntil) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.sv = user.sessionVersion;
        token.checkedAt = Date.now();
        return token;
      }

      // Reverification reguliere : un compte supprime, desactive, dont le mot de
      // passe ou le role a change, perd sa session en moins d'une minute.
      if (typeof token.checkedAt !== "number" || Date.now() - token.checkedAt > RECHECK_MS) {
        const current = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { isActive: true, role: true, sessionVersion: true, name: true },
        });
        if (!current || !current.isActive || current.sessionVersion !== token.sv) return null;
        token.role = current.role;
        token.name = current.name;
        token.checkedAt = Date.now();
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
