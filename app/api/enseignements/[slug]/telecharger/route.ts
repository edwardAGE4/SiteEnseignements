import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const teaching = await prisma.teaching.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, pdfUrl: true },
  });

  if (!teaching || !teaching.pdfUrl) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!isRateLimited(`telechargement:${ip}:${slug}`, 10_000)) {
    await prisma.teaching.update({
      where: { id: teaching.id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  return NextResponse.redirect(teaching.pdfUrl);
}
