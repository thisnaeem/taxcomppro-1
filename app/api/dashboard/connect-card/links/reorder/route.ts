import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Body: { ids: string[] } — new top-to-bottom order for the caller's own links.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.digitalCard.findUnique({ where: { userId: session.user.id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { ids } = await req.json() as { ids?: string[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids array required" }, { status: 400 });

  const owned = await prisma.cardLink.findMany({ where: { cardId: card.id, id: { in: ids } }, select: { id: true } });
  const ownedIds = new Set(owned.map((l: { id: string }) => l.id));

  await prisma.$transaction(
    ids.filter(id => ownedIds.has(id)).map((id, order) =>
      prisma.cardLink.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ ok: true });
}
