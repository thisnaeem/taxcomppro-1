import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.digitalCard.findUnique({
    where: { userId: session.user.id },
    include: { links: { orderBy: { clickCount: "desc" } } },
  });
  if (!card) return NextResponse.json({ error: "Activate your Connect Card first." }, { status: 404 });

  type LinkRow = { id: string; label: string; clickCount: number; isActive: boolean };
  const links = card.links as LinkRow[];
  const totalLinkClicks = links.reduce((sum: number, l: LinkRow) => sum + l.clickCount, 0);

  return NextResponse.json({
    pageViews: card.pageViews,
    nfcTaps: card.nfcTaps,
    qrScans: card.qrScans,
    contactSaves: card.contactSaves,
    shareClicks: card.shareClicks,
    fullProfileClicks: card.fullProfileClicks,
    totalLinkClicks,
    links: links.map((l: LinkRow) => ({ id: l.id, label: l.label, clickCount: l.clickCount, isActive: l.isActive })),
  });
}
