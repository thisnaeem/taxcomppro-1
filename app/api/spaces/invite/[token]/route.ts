import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

// GET /api/spaces/invite/[token] — resolve shareToken → space id and accept invite
export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;

  const space = await prisma.space.findUnique({
    where: { shareToken: token },
    select: { id: true, name: true, isLive: true, scheduledAt: true, endedAt: true },
  });

  if (!space) return NextResponse.json({ error: "Invite link not found" }, { status: 404 });
  if (space.endedAt) return NextResponse.json({ error: "This Pro Talk has ended" }, { status: 410 });

  const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  if (session?.user?.id) {
    try {
      if (space.isLive) {
        await prisma.spaceAttendance.upsert({
          where: {
            spaceId_userId: {
              spaceId: space.id,
              userId: session.user.id,
            },
          },
          update: {
            leftAt: null,
          },
          create: {
            spaceId: space.id,
            userId: session.user.id,
          },
        });
      } else {
        await prisma.spaceRsvp.upsert({
          where: {
            spaceId_userId: {
              spaceId: space.id,
              userId: session.user.id,
            },
          },
          update: {},
          create: {
            spaceId: space.id,
            userId: session.user.id,
            name: session.user.name ?? "Member",
            email: session.user.email ?? null,
          },
        });
      }
    } catch {
      // Non-fatal: do not block invite link resolution
    }
  }

  const response = NextResponse.json(space);
  response.cookies.set(`pro-talk-invite-${space.id}`, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
