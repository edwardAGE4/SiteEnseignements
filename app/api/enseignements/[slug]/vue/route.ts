import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/security/request";

const COOKIE_PREFIX = "vu_";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h : evite de recompter les rafraichissements rapides

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ counted: false }, { status: 403 });
  }

  const { slug } = await context.params;
  const cookieStore = await cookies();
  const cookieName = `${COOKIE_PREFIX}${slug}`;

  if (cookieStore.get(cookieName)) {
    return NextResponse.json({ counted: false });
  }

  const ip = clientIp(request.headers);
  if (isRateLimited(`vue:${ip}:${slug}`, 30_000)) {
    return NextResponse.json({ counted: false });
  }

  const teaching = await prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true },
  });

  if (!teaching) {
    return NextResponse.json({ counted: false }, { status: 404 });
  }

  await prisma.teaching.update({
    where: { id: teaching.id },
    data: { viewCount: { increment: 1 } },
  });

  const response = NextResponse.json({ counted: true });
  response.cookies.set(cookieName, "1", {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
