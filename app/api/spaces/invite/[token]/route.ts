import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

// GET /api/spaces/invite/[token] — resolve shareToken → space id
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const space = await prisma.space.findUnique({
    where: { shareToken: token },
    select: { id: true, name: true, isLive: true, scheduledAt: true, endedAt: true },
  });

  if (!space) return NextResponse.json({ error: "Invite link not found" }, { status: 404 });
  if (space.endedAt) return NextResponse.json({ error: "This Pro Talk has ended" }, { status: 410 });

  return NextResponse.json(space);
}
