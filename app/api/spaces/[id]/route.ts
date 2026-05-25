import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoomServiceClient } from "livekit-server-sdk";

type Params = { params: Promise<{ id: string }> };

// GET /api/spaces/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, image: true, headline: true } },
    },
  });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(space);
}

// DELETE /api/spaces/[id] — host or admin ends a space
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isHost  = space.hostId === session.user.id;
  if (!isAdmin && !isHost)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Mark ended in DB
  await prisma.space.update({
    where: { id },
    data: { isLive: false, endedAt: new Date() },
  });

  // Force-disconnect all LiveKit participants by deleting the room.
  // This triggers onDisconnected on every client → they redirect to /spaces automatically.
  try {
    // RoomServiceClient needs https://, not wss://
    const lkHttpUrl = (process.env.LIVEKIT_URL ?? "").replace(/^wss?:\/\//, "https://");
    const svc = new RoomServiceClient(
      lkHttpUrl,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
    );
    await svc.deleteRoom(space.roomName);
  } catch {
    // Non-fatal: room may already be empty/gone
  }

  return NextResponse.json({ ok: true });
}
