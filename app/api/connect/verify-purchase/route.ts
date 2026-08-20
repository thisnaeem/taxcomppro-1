import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  // 1. Check if user already has a purchased card in DB
  const existingCard = await prisma.digitalCard.findUnique({
    where: { userId: session.user.id },
  });

  if (existingCard?.isPurchased || existingCard?.isActivated || session.user.role === "ADMIN") {
    return NextResponse.json({
      hasPurchased: true,
      isActivated: !!existingCard?.isActivated,
      username: existingCard?.username ?? null,
    });
  }

  // 2. If a session_id was passed from Stripe redirect, verify with Stripe API
  if (sessionId) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        checkoutSession.payment_status === "paid" &&
        (checkoutSession.metadata?.userId === session.user.id ||
          checkoutSession.customer_email === session.user.email)
      ) {
        const fallbackUsername = `user-${session.user.id.slice(-6).toLowerCase()}`;
        const card = await prisma.digitalCard.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            username: fallbackUsername,
            isPurchased: true,
            isActivated: false,
            stripeSessionId: checkoutSession.id,
          },
          update: {
            isPurchased: true,
            stripeSessionId: checkoutSession.id,
          },
        });

        return NextResponse.json({
          hasPurchased: true,
          isActivated: card.isActivated,
          username: card.username,
        });
      }
    } catch (e) {
      console.error("Failed to verify Stripe checkout session:", e);
    }
  }

  return NextResponse.json({
    hasPurchased: false,
    isActivated: false,
    username: null,
  });
}
