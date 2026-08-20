import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", redirect: "/login?next=/connect" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: 2900, // $29.00 USD
          product_data: {
            name: "ProConnect NFC Digital Business Card",
            description: "Physical NFC digital business card + verified Tax Compliance Pro profile",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      product: "proconnect_card",
      type: "proconnect_card",
    },
    success_url: `${appUrl}/connect?purchased=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/connect`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
