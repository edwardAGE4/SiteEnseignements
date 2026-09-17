/**
 * Donnees de demonstration.
 * Ces contenus sont fictifs et servent uniquement a illustrer le fonctionnement
 * de la plateforme. Ils ne representent en aucun cas les propos reels du
 * Pasteur Jean-Marc GNALI et doivent etre remplaces par du contenu authentique
 * avant toute mise en production.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_CATEGORIES = [
  {
    name: "Foi",
    slug: "foi",
    description: "Des enseignements pour fortifier et comprendre la foi au quotidien.",
    order: 1,
  },
  {
    name: "Famille",
    slug: "famille",
    description: "Batir des foyers stables autour de la parole et de l'amour.",
    order: 2,
  },
  {
    name: "Leadership",
    slug: "leadership",
    description: "Grandir dans la responsabilite et servir avec sagesse.",
    order: 3,
  },
  {
    name: "Priere",
    slug: "priere",
    description: "Approfondir une vie de priere authentique et constante.",
    order: 4,
  },
];

const DEMO_TEACHINGS = [
  {
    title: "[Demo] La foi qui transforme",
    slug: "demo-la-foi-qui-transforme",
    description:
      "[Contenu de demonstration] Un enseignement sur la maniere dont une comprehension nouvelle de la foi transforme le regard et les decisions du quotidien.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    spotifyUrl: null,
    pdfUrl: null,
    tags: ["foi", "transformation"],
    status: "PUBLISHED" as const,
    categorySlug: "foi",
  },
  {
    title: "[Demo] Batir un foyer sur le roc",
    slug: "demo-batir-un-foyer-sur-le-roc",
    description:
      "[Contenu de demonstration] Principes pratiques pour fonder une famille stable et unie autour de valeurs solides.",
    youtubeUrl: null,
    spotifyUrl: "https://open.spotify.com/episode/0000000000000000000000",
    pdfUrl: null,
    tags: ["famille", "fondations"],
    status: "PUBLISHED" as const,
    categorySlug: "famille",
  },
  {
    title: "[Demo] Le leadership serviteur",
    slug: "demo-le-leadership-serviteur",
    description:
      "[Contenu de demonstration] Comprendre l'autorite comme un service et non comme un privilege.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    spotifyUrl: null,
    pdfUrl: null,
    tags: ["leadership", "service"],
    status: "PUBLISHED" as const,
    categorySlug: "leadership",
  },
  {
    title: "[Demo] Une priere qui perce les cieux",
    slug: "demo-une-priere-qui-perce-les-cieux",
    description:
      "[Contenu de demonstration] Les cles d'une vie de priere constante, sincere et efficace.",
    youtubeUrl: null,
    spotifyUrl: "https://open.spotify.com/episode/0000000000000000000001",
    pdfUrl: null,
    tags: ["priere", "intimite"],
    status: "PUBLISHED" as const,
    categorySlug: "priere",
  },
  {
    title: "[Demo] Comprendre avant de transmettre",
    slug: "demo-comprendre-avant-de-transmettre",
    description:
      "[Contenu de demonstration] Pourquoi la transmission commence toujours par une comprehension nouvelle du texte.",
    youtubeUrl: null,
    spotifyUrl: null,
    pdfUrl: null,
    tags: ["foi", "enseignement"],
    status: "DRAFT" as const,
    categorySlug: "foi",
  },
];

async function main() {
  console.log("Seed: creation des utilisateurs de demonstration...");

  const adminPasswordHash = await bcrypt.hash("ChangeMoi123!", 12);
  const editorPasswordHash = await bcrypt.hash("ChangeMoi123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: {},
    create: {
      email: "admin@demo.local",
      name: "[Demo] Administrateur",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "editeur@demo.local" },
    update: {},
    create: {
      email: "editeur@demo.local",
      name: "[Demo] Editeur",
      passwordHash: editorPasswordHash,
      role: "EDITOR",
    },
  });

  console.log("Seed: creation des categories de demonstration...");
  const categoryBySlug = new Map<string, string>();
  for (const category of DEMO_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        order: category.order,
      },
      create: category,
    });
    categoryBySlug.set(category.slug, created.id);
  }

  console.log("Seed: creation des enseignements de demonstration...");
  for (const teaching of DEMO_TEACHINGS) {
    const { categorySlug, ...data } = teaching;
    const categoryId = categoryBySlug.get(categorySlug);
    if (!categoryId) continue;

    await prisma.teaching.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        createdById: admin.id,
        categories: {
          create: [{ categoryId }],
        },
      },
    });
  }

  console.log("Seed termine.");
  console.log("Comptes de demonstration :");
  console.log("  admin@demo.local / ChangeMoi123! (ADMIN)");
  console.log("  editeur@demo.local / ChangeMoi123! (EDITOR)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
