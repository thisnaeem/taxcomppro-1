import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMembershipUpgradedEmail } from "@/lib/email";
import { getDubCheckoutFields, syncDubStripeCustomer } from "@/lib/dub-attribution";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  VIP:              process.env.STRIPE_VIP_PRICE_ID!,
  MARKETPLACE:      process.env.STRIPE_MARKETPLACE_PRICE_ID!,
  MARKETPLACE_PLUS: process.env.STRIPE_MARKETPLACE_PLUS_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tier, couponCode, redirectUrl } = (await req.json()) as {
    tier: string;
    couponCode?: string;
    redirectUrl?: string;
  };
  const priceId = PRICE_IDS[tier];
  if (!priceId) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await prisma.marketplaceCoupon.findFirst({
      where: {
        code: couponCode.toUpperCase().trim(),
        isActive: true,
      },
    });

    if (coupon) {
      const isValidTime = !coupon.expiresAt || new Date() <= coupon.expiresAt;
      const isValidUses = coupon.maxUses == null || coupon.usedCount < coupon.maxUses;
      const isValidScope =
        !coupon.listingId ||
        coupon.listingId === "ALL" ||
        coupon.listingId === "MEMBERSHIP" ||
        coupon.listingId === "UPGRADE" ||
        coupon.listingId === tier;

      if (isValidTime && isValidUses && isValidScope) {
        appliedCoupon = coupon;

        // If 100% discount, grant membership upgrade immediately without Stripe checkout
        if (coupon.discountType === "PERCENT" && coupon.discountValue >= 100) {
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await prisma.user.update({
            where: { id: user.id },
            data: { tier: tier as any },
          });

          await prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              plan: tier as any,
              status: "active",
              currentPeriodEnd: periodEnd,
            },
            update: {
              plan: tier as any,
              status: "active",
              currentPeriodEnd: periodEnd,
            },
          });

          await prisma.marketplaceCoupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });

          if (user.email) {
            sendMembershipUpgradedEmail({
              to: user.email,
              userName: user.name || "Member",
              tier,
              currentPeriodEnd: periodEnd,
              isComplimentary: true,
            }).catch(err => console.error("[Checkout Coupon] Failed to send upgrade email:", err));
          }

          return NextResponse.json({ url: redirectUrl || "/feed?welcome=1" });
        }

        await prisma.marketplaceCoupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  const dub = getDubCheckoutFields(req, user.id);

  // Create or retrieve Stripe customer and preserve Dub attribution for renewals.
  const customerId = await syncDubStripeCustomer({
    stripe,
    customerId: user.stripeCustomerId,
    email: user.email,
    name: user.name,
    userId: user.id,
    clickId: dub.clickId,
  });
  if (!user.stripeCustomerId) {
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  // Read referral code from cookie
  const refCode = req.cookies.get("ref_code")?.value ?? null;

  const targetPath = redirectUrl || "/feed?welcome=1";
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}${
    targetPath.includes("?") ? targetPath + "&" : targetPath + "?"
  }session_id={CHECKOUT_SESSION_ID}`;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    allow_promotion_codes: true,
    phone_number_collection: { enabled: true },
    payment_method_types: ["card"],
    ...(dub.clientReferenceId ? { client_reference_id: dub.clientReferenceId } : {}),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?step=membership&canceled=1`,
    metadata: {
      userId: user.id,
      tier,
      ...dub.metadata,
      couponCode: appliedCoupon?.code || "",
      ...(refCode ? { referralCode: refCode } : {}),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
