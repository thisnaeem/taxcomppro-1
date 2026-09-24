import { NextRequest, NextResponse } from "next/server";
import { canAccessSpace } from "@/lib/spaceAccess";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { RoomServiceClient } from "livekit-server-sdk";

type Params = { params: Promise<{ id: string }> };

const HOST_SELECT = { id: true, name: true, image: true, headline: true, role: true, tier: true };

// GET /api/spaces/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      host: { select: HOST_SELECT },
      _count: { select: { rsvps: true, attendances: true } },
    },
  });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const session = await auth.api.getSession({ headers: req.headers });
  if (!canAccessSpace(req, space, session?.user)) return NextResponse.json({ error: "This Pro Talk is invite only. Open your invitation link to join." }, { status: 403 });
  return NextResponse.json(space);
}

// PATCH /api/spaces/[id] — host starts a scheduled space or updates replay info
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isHost = space.hostId === session.user.id;
  if (!isAdmin && !isHost)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dataToUpdate: Record<string, unknown> = {};
  if (body.visibility !== undefined) {
    if (body.visibility !== "PUBLIC" && body.visibility !== "PRIVATE") return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    dataToUpdate.visibility = body.visibility;
    if (body.visibility === "PRIVATE" && space.visibility !== "PRIVATE") {
      // An old public link must not become an invitation to a private room.
      dataToUpdate.shareToken = nanoid(32);
    }
  }

  if (typeof body.isLive === "boolean") {
    dataToUpdate.isLive = body.isLive;
  } else if (Object.keys(body).length === 0) {
    dataToUpdate.isLive = true;
  }

  // Scheduled Pro Talks cannot be started before their scheduled time
  if (dataToUpdate.isLive === true && space.scheduledAt && new Date(space.scheduledAt).getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Scheduled Pro Talks cannot be started before their scheduled time." },
      { status: 400 }
    );
  }

  if (typeof body.replayUrl === "string") {
    dataToUpdate.replayUrl = body.replayUrl.trim() || null;
    dataToUpdate.isReplay = true;
  }
  if (typeof body.replayDurationMinutes === "number") {
    dataToUpdate.replayDurationMinutes = body.replayDurationMinutes;
  }
  if (typeof body.isReplay === "boolean") {
    dataToUpdate.isReplay = body.isReplay;
  }

  const updated = await prisma.space.update({
    where: { id },
    data: dataToUpdate,
    include: {
      host: { select: HOST_SELECT },
      _count: { select: { rsvps: true, attendances: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/spaces/[id] — only host can end a space
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isHost = space.hostId === session.user.id;
  if (!isHost)
    return NextResponse.json({ error: "Only the host can end this Pro Talk." }, { status: 403 });

  const endedAt = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - new Date(space.createdAt).getTime()) / 60000)
  );

  // Compute total unique attendees
  const uniqueAttendees = await prisma.spaceAttendance.count({
    where: { spaceId: id },
  });
  const total = Math.max(space.totalAttendees, uniqueAttendees);

  // Mark ended in DB
  const endedSpace = await prisma.space.update({
    where: { id },
    data: {
      isLive: false,
      endedAt,
      totalAttendees: total,
      replayDurationMinutes: durationMinutes,
    },
    select: {
      id: true,
      name: true,
      totalAttendees: true,
      peakAttendees: true,
      createdAt: true,
      endedAt: true,
      replayDurationMinutes: true,
    },
  });

  // Force-disconnect all LiveKit participants by deleting the room.
  try {
    const lkHttpUrl = (process.env.LIVEKIT_URL ?? "").replace(/^wss?:\/\//, "https://");
    const svc = new RoomServiceClient(
      lkHttpUrl,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );
    await svc.deleteRoom(space.roomName);
  } catch {
    // Non-fatal: room may already be empty/gone
  }

  return NextResponse.json({
    ok: true,
    summary: {
      totalAttendees: endedSpace.totalAttendees,
      peakAttendees: endedSpace.peakAttendees,
      durationMinutes: endedSpace.replayDurationMinutes,
    },
  });
}
