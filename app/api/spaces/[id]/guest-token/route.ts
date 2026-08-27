import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccessToken } from "livekit-server-sdk";

type Params = { params: Promise<{ id: string }> };

// POST /api/spaces/[id]/guest-token — generate a LiveKit join token for guests (no auth required)
// Body: { displayName: string }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space || !space.isLive)
    return NextResponse.json({ error: "This Pro Talk has ended or does not exist." }, { status: 404 });

  const { displayName } = await req.json();
  const name = (typeof displayName === "string" && displayName.trim())
    ? displayName.trim().slice(0, 40)
    : "Guest";

  const apiKey    = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  // Use a unique guest identity so multiple guests don't collide
  const identity = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    metadata: JSON.stringify({ image: null, isGuest: true }),
  });

  token.addGrant({
    roomJoin:       true,
    room:           space.roomName,
    canPublish:     true,
    canPublishData: true,
    canSubscribe:   true,
    roomAdmin:      false,
  });

  const jwt = await token.toJwt();
  return NextResponse.json({ token: jwt, roomName: space.roomName, identity });
}
