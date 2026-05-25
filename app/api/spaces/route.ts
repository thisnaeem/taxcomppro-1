import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// GET  /api/spaces — list all live spaces
export async function GET() {
  const spaces = await prisma.space.findMany({
    where: { isLive: true },
    orderBy: { createdAt: "desc" },
    include: {
      host: { select: { id: true, name: true, image: true, headline: true } },
    },
  });
  return NextResponse.json(spaces);
}

// POST /api/spaces — admin or marketplace plus or paid host creates a new space
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, tier: true } });
  const canHost = dbUser?.role === "ADMIN" || dbUser?.tier === "MARKETPLACE_PLUS";

  // Also allow if they passed a valid one-time stripe session (verified server-side)
  const body = await req.json();
  const { name, description, hostSessionId } = body;

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


  const roomName = `space-${nanoid(10)}`;

  const space = await prisma.space.create({
    data: {
      name:        name.trim(),
      description: description?.trim() ?? null,
      hostId:      session.user.id,
      roomName,
    },
    include: {
      host: { select: { id: true, name: true, image: true, headline: true } },
    },
  });

  return NextResponse.json(space, { status: 201 });
}
