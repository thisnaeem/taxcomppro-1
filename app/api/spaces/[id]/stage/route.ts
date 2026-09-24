import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { proTalkPublishPermissions } from "@/lib/proTalkPermissions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space?.isLive) return NextResponse.json({ error: "Talk is not live" }, { status: 404 });
  const isHost = space.hostId === session.user.id;
  if (!isHost) return NextResponse.json({ error: "Only the host can manage the stage and speakers" }, { status: 403 });
  const { identity, action } = await req.json();
  if (typeof identity !== "string" || !["speaker", "audience", "cohost"].includes(action)) return NextResponse.json({ error: "Invalid stage action" }, { status: 400 });
  if (identity === space.hostId) return NextResponse.json({ error: "Cannot modify host stage permissions" }, { status: 400 });
  try {
    const service = new RoomServiceClient((process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "").replace(/^ws/, "http"), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
    const participant = await service.getParticipant(space.roomName, identity);
    const metadata = JSON.parse(participant.metadata || "{}");
    const role = action === "cohost" ? "CO_HOST" : action === "speaker" ? "SPEAKER" : "ATTENDEE";
    await service.updateParticipant(space.roomName, identity, {
      metadata: JSON.stringify({ ...metadata, role, isCoHost: action === "cohost" }),
      permission: proTalkPublishPermissions(action !== "audience"),
    });
    const coHostIds = space.coHostIds.filter(value => value !== identity);
    if (action === "cohost") coHostIds.push(identity);
    await prisma.space.update({ where: { id }, data: { coHostIds } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Stage update failed", error);
    return NextResponse.json({ error: "Could not update stage permissions. Please try again." }, { status: 502 });
  }
}
