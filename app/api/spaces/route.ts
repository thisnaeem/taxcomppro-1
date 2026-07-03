import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const HOST_SELECT = { id: true, name: true, image: true, headline: true };

// GET /api/spaces — list live + upcoming spaces
export async function GET() {
  const spaces = await prisma.space.findMany({
    where: {
      OR: [
        { isLive: true },
        // Upcoming: not yet live and scheduled in the future
        { isLive: false, endedAt: null, scheduledAt: { gt: new Date() } },
      ],
    },
    orderBy: [{ isLive: "desc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
    include: {
      host: { select: HOST_SELECT },
      _count: { select: { rsvps: true } },
    },
  });
  return NextResponse.json(spaces);
}

// POST /api/spaces — admin or marketplace plus or paid host creates a new space
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tier: true },
  });
  const canHost = dbUser?.role === "ADMIN" || dbUser?.tier === "MARKETPLACE_PLUS";

  const body = await req.json();
  const { name, description, hostSessionId, scheduledAt } = body;

  let hostVerified = canHost;
  if (!hostVerified && hostSessionId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const stripeSession = await stripe.checkout.sessions.retrieve(hostSessionId);
      if (
        stripeSession.payment_status === "paid" &&
        stripeSession.metadata?.userId === session.user.id &&
        stripeSession.metadata?.type === "pro_talk_host"
      ) {
        hostVerified = true;
      }
    } catch { /* ignore */ }
  }

  if (!hostVerified) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Parse scheduledAt if provided
  let scheduledDate: Date | null = null;
  if (scheduledAt) {
    const parsed = new Date(scheduledAt);
    if (!isNaN(parsed.getTime()) && parsed > new Date()) {
      scheduledDate = parsed;
    }
  }

  const roomName   = `space-${nanoid(10)}`;
  const shareToken = nanoid(8);

  const space = await prisma.space.create({
    data: {
      name:        name.trim(),
      description: description?.trim() ?? null,
      hostId:      session.user.id,
      roomName,
      shareToken,
      // If scheduled for later, mark not live yet
      isLive:      scheduledDate ? false : true,
      scheduledAt: scheduledDate,
    },
    include: {
      host:   { select: HOST_SELECT },
      _count: { select: { rsvps: true } },
    },
  });

  return NextResponse.json(space, { status: 201 });
}
