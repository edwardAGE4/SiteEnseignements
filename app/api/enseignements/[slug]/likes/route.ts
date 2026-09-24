import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exceedsRate } from "@/lib/rate-limit";

/**
 * "J'aime" anonymes sur les medias d'un enseignement.
 * Cibles : "youtube", "spotify" ou "pdf:<id du document>".
 * Chaque visiteur est reconnu par un identifiant aleatoire stocke en cookie :
 * un seul "j'aime" par visiteur et par media, un second clic le retire.
 */
const VISITOR_COOKIE = "visiteur_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

type Context = { params: Promise<{ slug: string }> };

async function findTeaching(slug: string) {
  return prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, youtubeUrl: true, spotifyUrl: true, documents: { select: { id: true } } },
  });
}

/** Cibles qui existent reellement pour cet enseignement. */
function validTargets(teaching: NonNullable<Awaited<ReturnType<typeof findTeaching>>>) {
  return new Set([
    ...(teaching.youtubeUrl ? ["youtube"] : []),
    ...(teaching.spotifyUrl ? ["spotify"] : []),
    ...teaching.documents.map((document) => `pdf:${document.id}`),
  ]);
}

async function countLikes(teachingId: string) {
  const groups = await prisma.mediaLike.groupBy({
    by: ["target"],
    where: { teachingId },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((group) => [group.target, group._count._all]));
}

export async function GET(request: NextRequest, context: Context) {
  const { slug } = await context.params;
  const teaching = await findTeaching(slug);
  if (!teaching) return NextResponse.json({ error: "Enseignement introuvable" }, { status: 404 });

  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const [counts, liked] = await Promise.all([
    countLikes(teaching.id),
    visitorId
      ? prisma.mediaLike.findMany({ where: { teachingId: teaching.id, visitorId }, select: { target: true } })
      : [],
  ]);

  return NextResponse.json(
    { counts, liked: liked.map((like) => like.target) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest, context: Context) {
  const { slug } = await context.params;
  const body = (await request.json().catch(() => null)) as { target?: unknown } | null;
  const target = typeof body?.target === "string" ? body.target : "";

  const teaching = await findTeaching(slug);
  if (!teaching) return NextResponse.json({ error: "Enseignement introuvable" }, { status: 404 });
  if (!validTargets(teaching).has(target)) {
    return NextResponse.json({ error: "Media inconnu" }, { status: 400 });
  }

  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId ?? randomUUID();
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";

  if (exceedsRate(`like:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Trop de clics, patientez un instant." }, { status: 429 });
  }

  const where = { teachingId_target_visitorId: { teachingId: teaching.id, target, visitorId } };
  const already = await prisma.mediaLike.findUnique({ where });

  if (already) {
    await prisma.mediaLike.delete({ where });
  } else {
    // upsert : absorbe un double clic simultane sans erreur d'unicite
    await prisma.mediaLike.upsert({
      where,
      create: { teachingId: teaching.id, target, visitorId },
      update: {},
    });
  }

  const count = await prisma.mediaLike.count({ where: { teachingId: teaching.id, target } });
  const response = NextResponse.json({ target, liked: !already, count });

  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: ONE_YEAR,
      path: "/",
    });
  }

  return response;
}
