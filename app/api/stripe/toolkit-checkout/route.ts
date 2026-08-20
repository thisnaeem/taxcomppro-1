import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToolkit } from "@/lib/toolkits";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolkitId, couponCode } = (await req.json()) as { toolkitId: string; couponCode?: string };
  const toolkit = getToolkit(toolkitId);
  if (!toolkit) return NextResponse.json({ error: "Invalid toolkit" }, { status: 400 });

  // Check if user already purchased this toolkit
  const existing = await prisma.toolkitPurchase.findFirst({
    where: { userId: session.user.id, toolkitId },
  });
  if (existing) return NextResponse.json({ error: "Already purchased", alreadyOwned: true }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let finalPrice = toolkit.price;
  let appliedCoupon = null;

  if (couponCode && finalPrice > 0) {
    const coupon = await prisma.marketplaceCoupon.findFirst({
      where: {
        code: couponCode.toUpperCase().trim(),
        isActive: true,
      },
    });

    if (coupon) {
      const isValidTime = !coupon.expiresAt || new Date() <= coupon.expiresAt;
      const isValidUses = coupon.maxUses == null || coupon.usedCount < coupon.maxUses;
      const isValidScope = !coupon.listingId || coupon.listingId === "ALL" || coupon.listingId === "TOOLKITS" || coupon.listingId === toolkitId;

      if (isValidTime && isValidUses && isValidScope) {
        appliedCoupon = coupon;
        if (coupon.discountType === "PERCENT") {
          const discount = (finalPrice * coupon.discountValue) / 100;
          finalPrice = Math.max(0, finalPrice - discount);
        } else {
          finalPrice = Math.max(0, finalPrice - coupon.discountValue);
        }

        await prisma.marketplaceCoupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  // If 100% discount, grant purchase immediately
  if (finalPrice <= 0) {
    await prisma.toolkitPurchase.create({
      data: {
        userId: session.user.id,
        toolkitId,
        membershipGranted: toolkit.membershipMonths > 0,
        membershipTier: toolkit.membershipMonths > 0 ? "VIP" : undefined,
        membershipMonths: toolkit.membershipMonths,
        stripeSessionId: `free_claim_${Date.now()}`,
      },
    });

    if (toolkit.membershipMonths > 0) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + toolkit.membershipMonths);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { tier: "VIP" },
      });
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: "VIP",
          status: "active",
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan: "VIP",
          status: "active",
          currentPeriodEnd: periodEnd,
        },
      });
    }

    return NextResponse.json({ url: "/toolkits/success?free=1" });
  }

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name ?? "" });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    allow_promotion_codes: true,
    payment_method_types: ["card"],
    // Save card for future VIP trial billing only if this toolkit includes membership
    ...(toolkit.membershipMonths > 0 ? {
      payment_intent_data: {
        setup_future_usage: "off_session" as const,
        metadata: { userId: user.id, source: "toolkit_purchase" },
      },
    } : {}),
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: Math.round(finalPrice * 100),
        product_data: {
          name: toolkit.name + (appliedCoupon ? ` (${appliedCoupon.code} Applied)` : ""),
          description: `Includes ${toolkit.membershipMonths} months FREE VIP membership, then $39.99/month`,
          images: [],
        },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/toolkits/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/toolkits`,
    metadata: {
      userId:           user.id,
      toolkitId,
      membershipTier:   toolkit.membershipMonths > 0 ? "VIP" : "",
      membershipMonths: String(toolkit.membershipMonths),
      type:             "toolkit",
      couponCode:       appliedCoupon?.code || "",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
