import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdminPurchase } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/pro-ads/verify  { adId, sessionId }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { adId, sessionId } = await req.json() as { adId: string; sessionId: string };

  const ad = await prisma.proAd.findUnique({ where: { id: adId } });
  if (!ad || ad.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ad.status !== "PENDING_PAYMENT")
    return NextResponse.json({ ok: true, status: ad.status });

  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  if (stripeSession.payment_status !== "paid")
    return NextResponse.json({ error: "Payment not complete" }, { status: 400 });

  await prisma.proAd.update({
    where: { id: adId },
    data: { status: "PENDING_APPROVAL", stripeSessionId: sessionId },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await prisma.notification.createMany({
    data: admins.map(a => ({
      userId: a.id,
      type:    "AD_PENDING",
      title:   "New Ad Awaiting Approval",
      message: `"${ad.title}" by ${session.user.name} — ${ad.placement} for ${ad.durationMonths} month(s)`,
      link:    "/admin/approvals",
    })),
    skipDuplicates: true,
  });

  notifyAdminPurchase({
    userId: session.user.id,
    itemType: "pro_ad",
    itemName: `Pro Ad: "${ad.title}" (${ad.placement}, ${ad.durationMonths} mo)`,
    amountTotal: stripeSession.amount_total,
    currency: stripeSession.currency,
    stripeSessionId: sessionId,
    metadata: stripeSession.metadata,
    customerEmail: stripeSession.customer_details?.email,
    customerName: stripeSession.customer_details?.name,
  }).catch(err => console.error("[Pro Ads Verify] Admin alert error:", err));

  return NextResponse.json({ ok: true, status: "PENDING_APPROVAL" });
}
