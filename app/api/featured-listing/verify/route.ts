import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { notifyAdminPurchase } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { featuredId, sessionId } = await req.json();
  if (!featuredId || !sessionId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  if (stripeSession.payment_status !== "paid") return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });

  const updated = await prisma.featuredListingRequest.update({
    where: { id: featuredId, userId: session.user.id },
    data: { status: "PENDING_APPROVAL", stripeSessionId: sessionId },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await prisma.notification.createMany({
    data: admins.map(a => ({
      userId: a.id,
      type: "SYSTEM",
      title: "New Featured Listing Request",
      message: `${session.user.name} submitted a featured listing request for review.`,
    })),
  });

  notifyAdminPurchase({
    userId: session.user.id,
    itemType: "featured_listing",
    itemName: "Featured Listing Placement",
    amountTotal: stripeSession.amount_total,
    currency: stripeSession.currency,
    stripeSessionId: sessionId,
    metadata: stripeSession.metadata,
    customerEmail: stripeSession.customer_details?.email,
    customerName: stripeSession.customer_details?.name,
  }).catch(err => console.error("[Featured Listing Verify] Admin alert error:", err));

  return NextResponse.json(updated);
}
