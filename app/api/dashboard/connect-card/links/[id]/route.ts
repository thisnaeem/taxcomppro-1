import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function assertOwnership(userId: string, linkId: string) {
  const link = await prisma.cardLink.findUnique({ where: { id: linkId }, include: { card: true } });
  if (!link || link.card.userId !== userId) return null;
  return link;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const link = await assertOwnership(session.user.id, id);
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.label === "string") data.label = body.label;
  if (typeof body.url === "string") data.url = body.url;
  if (typeof body.icon === "string" || body.icon === null) data.icon = body.icon;
  if (typeof body.color === "string" || body.color === null) data.color = body.color;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.order === "number") data.order = body.order;
  if (typeof body.scheduledStart === "string" || body.scheduledStart === null) {
    data.scheduledStart = body.scheduledStart ? new Date(body.scheduledStart as string) : null;
  }
  if (typeof body.scheduledEnd === "string" || body.scheduledEnd === null) {
    data.scheduledEnd = body.scheduledEnd ? new Date(body.scheduledEnd as string) : null;
  }

  const updated = await prisma.cardLink.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const link = await assertOwnership(session.user.id, id);
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.cardLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
