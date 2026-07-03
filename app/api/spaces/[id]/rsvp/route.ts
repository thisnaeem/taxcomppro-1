import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/spaces/[id]/rsvp — host only: list all RSVPs
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isHost  = space.hostId === session.user.id;
  if (!isAdmin && !isHost)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rsvps = await prisma.spaceRsvp.findMany({
    where: { spaceId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, image: true, headline: true } },
    },
  });

  return NextResponse.json(rsvps);
}

// POST /api/spaces/[id]/rsvp — add current user to RSVP list
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Guests can RSVP with name + email
  const body = await req.json().catch(() => ({}));

  if (session) {
    // Authenticated user: upsert by userId
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const rsvp = await prisma.spaceRsvp.upsert({
      where: { spaceId_userId: { spaceId: id, userId: session.user.id } },
      create: {
        spaceId: id,
        userId:  session.user.id,
        name:    dbUser?.name ?? session.user.name ?? "Member",
        email:   session.user.email ?? null,
      },
      update: {}, // already RSVPed — no-op
    });
    return NextResponse.json(rsvp, { status: 201 });
  } else {
    // Guest RSVP — require name; email optional
    const { name, email } = body as { name?: string; email?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const rsvp = await prisma.spaceRsvp.create({
      data: {
        spaceId: id,
        userId:  null,
        name:    name.trim(),
        email:   email?.trim() ?? null,
      },
    });
    return NextResponse.json(rsvp, { status: 201 });
  }
}

// DELETE /api/spaces/[id]/rsvp — remove current user's RSVP
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.spaceRsvp.deleteMany({
    where: { spaceId: id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
