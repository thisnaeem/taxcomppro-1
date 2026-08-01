import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function ownCard(userId: string) {
  return prisma.digitalCard.findUnique({ where: { userId } });
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await ownCard(session.user.id);
  if (!card) return NextResponse.json([]);

  const links = await prisma.cardLink.findMany({ where: { cardId: card.id }, orderBy: { order: "asc" } });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await ownCard(session.user.id);
  if (!card) return NextResponse.json({ error: "Activate your Connect Card first." }, { status: 400 });

  const body = await req.json() as { label?: string; url?: string; icon?: string; color?: string };
  if (!body.label?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: "Label and URL are required." }, { status: 400 });
  }

  const maxOrder = await prisma.cardLink.aggregate({ where: { cardId: card.id }, _max: { order: true } });

  const link = await prisma.cardLink.create({
    data: {
      cardId: card.id,
      label: body.label.trim(),
      url: body.url.trim(),
      icon: body.icon ?? null,
      color: body.color ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
