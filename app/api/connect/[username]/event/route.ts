import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ username: string }> };

const COUNTER_FIELD: Record<string, string> = {
  CONTACT_SAVE: "contactSaves",
  SHARE: "shareClicks",
  FULL_PROFILE_CLICK: "fullProfileClicks",
  QR_SCAN: "qrScans",
};

// Lightweight click/tap tracking for the public Tap Card page. No auth
// required — anyone viewing the card (even signed-out visitors) can trigger
// these, same as clicking a Linktree button.
export async function POST(req: NextRequest, { params }: Params) {
  const { username } = await params;
  const body = await req.json().catch(() => ({})) as { type?: string; linkId?: string };
  const type = body.type ?? "";

  const card = await prisma.digitalCard.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  if (type === "LINK_CLICK") {
    if (!body.linkId) return NextResponse.json({ error: "linkId required" }, { status: 400 });
    await prisma.cardLink.updateMany({
      where: { id: body.linkId, cardId: card.id },
      data: { clickCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  }

  const field = COUNTER_FIELD[type];
  if (!field) return NextResponse.json({ error: "Unknown event type" }, { status: 400 });

  await prisma.digitalCard.update({ where: { id: card.id }, data: { [field]: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
