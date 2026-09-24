/**
 * Gestion des administrateurs en ligne de commande, utilisable sur n'importe
 * quelle base (locale ou production) via DATABASE_URL.
 *
 *   npm run db:admins                -> liste les comptes administrateurs
 *   npm run db:create-admin          -> cree (ou promeut) un administrateur
 *     variables requises : ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD (12 caracteres min.)
 *
 * Le mot de passe est passe par variable d'environnement (et non en argument)
 * pour ne pas apparaitre dans la liste des processus.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL n'est pas defini.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Hote de la base, sans identifiants, pour savoir sur quelle base on agit. */
function databaseLabel() {
  try {
    const url = new URL(connectionString!);
    return `${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "(URL illisible)";
  }
}

async function listAdmins() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  if (users.length === 0) {
    console.log("Aucun utilisateur dans cette base. Creez un administrateur avec : npm run db:create-admin");
    return;
  }

  console.table(
    users.map((user) => ({
      nom: user.name,
      email: user.email,
      role: user.role === "ADMIN" ? "Administrateur" : "Editeur",
      actif: user.isActive ? "oui" : "non",
      cree_le: user.createdAt.toISOString().slice(0, 10),
    })),
  );
  const adminCount = users.filter((user) => user.role === "ADMIN" && user.isActive).length;
  console.log(`${adminCount} administrateur(s) actif(s) sur ${users.length} compte(s).`);
}

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const name = process.env.ADMIN_NAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";

  const errors = [
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && "ADMIN_EMAIL manquant ou invalide.",
    name.length < 2 && "ADMIN_NAME manquant (2 caracteres minimum).",
    password.length < 12 && "ADMIN_PASSWORD manquant ou trop court (12 caracteres minimum).",
    password === "ChangeMoi123!" && "ADMIN_PASSWORD ne doit pas etre le mot de passe de demonstration.",
  ].filter(Boolean);

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "ADMIN" },
    // compte existant : promu administrateur, reactive, mot de passe remplace
    update: { name, passwordHash, role: "ADMIN", isActive: true },
  });

  console.log(
    existing
      ? `Compte existant ${email} : promu administrateur et mot de passe mis a jour.`
      : `Administrateur ${email} cree.`,
  );
}

async function main() {
  console.log(`Base : ${databaseLabel()}\n`);
  if (process.argv.includes("--create")) await createAdmin();
  else await listAdmins();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
