import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdminPurchase } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/message-blast/verify  { blastId, sessionId }
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blastId, sessionId } = await req.json() as { blastId: string; sessionId: string };

  const blast = await prisma.messageBlast.findUnique({ where: { id: blastId } });
  if (!blast || blast.senderId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (blast.status !== "PENDING_PAYMENT")
    return NextResponse.json({ ok: true, status: blast.status }); // already processed

  // Verify with Stripe
  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  if (stripeSession.payment_status !== "paid")
    return NextResponse.json({ error: "Payment not complete" }, { status: 400 });

  // Move to pending admin approval
  await prisma.messageBlast.update({
    where: { id: blastId },
    data: { status: "PENDING_APPROVAL", stripeSessionId: sessionId },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await prisma.notification.createMany({
    data: admins.map(a => ({
      userId: a.id,
      type:    "BLAST_PENDING",
      title:   "Message Blast Awaiting Approval",
      message: `"${blast.subject}" from ${session.user.name} — ${blast.recipientCount.toLocaleString()} recipients`,
      link:    "/admin?tab=blasts",
    })),
    skipDuplicates: true,
  });

  notifyAdminPurchase({
    userId: session.user.id,
    itemType: "message_blast",
    itemName: `Message Blast: "${blast.subject}" (${blast.recipientCount.toLocaleString()} recipients)`,
    amountTotal: stripeSession.amount_total,
    currency: stripeSession.currency,
    stripeSessionId: sessionId,
    metadata: stripeSession.metadata,
    customerEmail: stripeSession.customer_details?.email,
    customerName: stripeSession.customer_details?.name,
  }).catch(err => console.error("[Message Blast Verify] Admin alert error:", err));

  return NextResponse.json({ ok: true, status: "PENDING_APPROVAL" });
}
