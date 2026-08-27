import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessToken } from "livekit-server-sdk";

type Params = { params: Promise<{ id: string }> };

// POST /api/spaces/[id]/token — generate LiveKit join token
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space || !space.isLive)
    return NextResponse.json({ error: "Space not found or ended" }, { status: 404 });

  const apiKey    = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;
  const isHost    = session.user.id === space.hostId || session.user.role === "ADMIN";

  const token = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name:     session.user.name ?? session.user.id,
    metadata: JSON.stringify({ image: session.user.image ?? null }),
  });

  token.addGrant({
    roomJoin:       true,
    room:           space.roomName,
    canPublish:     true,
    canPublishData: true,
    canSubscribe:   true,
    roomAdmin:      isHost,
  });

  const jwt = await token.toJwt();
  return NextResponse.json({ token: jwt, roomName: space.roomName });
}
