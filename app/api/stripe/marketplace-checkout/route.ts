import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId, couponCode, refCode } = (await req.json()) as {
    listingId: string;
    couponCode?: string;
    refCode?: string;
  };
  if (!listingId) return NextResponse.json({ error: "Listing ID required" }, { status: 400 });

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.metadata && typeof listing.metadata === "object" && !Array.isArray(listing.metadata) && listing.metadata.isDemo) {
    return NextResponse.json({ error: "This is a demo listing for preview only. Checkout is disabled." }, { status: 400 });
  }

  // If user is seller, return error
  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "You are the seller of this listing" }, { status: 400 });
  }

  // Check if already purchased
  const existing = await prisma.marketplacePurchase.findUnique({
    where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
  });
  if (existing) {
    return NextResponse.json({ alreadyPurchased: true, message: "Already purchased" });
  }

  let finalPrice = listing.price || 0;
  let appliedCoupon = null;

  // Apply Coupon if provided
  if (couponCode && finalPrice > 0) {
    const coupon = await prisma.marketplaceCoupon.findFirst({
      where: {
        code: couponCode.toUpperCase().trim(),
        sellerId: listing.userId,
        isActive: true,
      },
    });

    if (coupon) {
      const isValidTime = !coupon.expiresAt || new Date() <= coupon.expiresAt;
      const isValidUses = coupon.maxUses == null || coupon.usedCount < coupon.maxUses;
      const isValidListing = !coupon.listingId || coupon.listingId === listing.id;

      if (isValidTime && isValidUses && isValidListing) {
        appliedCoupon = coupon;
        if (coupon.discountType === "PERCENT") {
          const discount = (finalPrice * coupon.discountValue) / 100;
          finalPrice = Math.max(0, finalPrice - discount);
        } else {
          finalPrice = Math.max(0, finalPrice - coupon.discountValue);
        }
        finalPrice = Math.round(finalPrice * 100) / 100;

        // Increment coupon use
        await prisma.marketplaceCoupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        }).catch(() => {});
      }
    }
  }

  // Track referral if provided
  if (refCode) {
    await prisma.marketplaceReferral.updateMany({
      where: { code: refCode.toUpperCase().trim() },
      data: {
        conversions: { increment: 1 },
        earningsUsd: { increment: Math.round(finalPrice * 0.1 * 100) / 100 },
      },
    }).catch(() => {});
  }

  // If free listing or 100% coupon discount, record purchase immediately
  if (finalPrice <= 0) {
    await prisma.marketplacePurchase.create({
      data: {
        userId: session.user.id,
        listingId: listing.id,
        price: 0,
      },
    });
    return NextResponse.json({ success: true, isFree: true });
  }

  // Paid listing: Create Stripe Checkout Session
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const slugOrId = listing.slug || listing.id;

  const seller = await prisma.user.findUnique({
    where: { id: listing.userId },
    select: { id: true, stripeAccountId: true, stripeOnboarded: true, role: true, email: true, name: true },
  });

  // Verify seller has connected their Stripe account
  if (!seller?.stripeAccountId) {
    return NextResponse.json(
      { error: "This seller has not yet connected their Stripe payout account to receive payments. Purchases are paused until setup is complete." },
      { status: 400 }
    );
  }

  // Verify charges_enabled with Stripe if not yet flagged in DB
  let isChargesEnabled = seller.stripeOnboarded;
  if (!isChargesEnabled && seller.stripeAccountId) {
    try {
      const acct = await stripe.accounts.retrieve(seller.stripeAccountId);
      if (acct.charges_enabled) {
        isChargesEnabled = true;
        await prisma.user.update({
          where: { id: seller.id },
          data: { stripeOnboarded: true },
        }).catch(() => {});
      }
    } catch (err: any) {
      console.warn("[Marketplace Checkout] Failed to check seller account status:", err?.message);
    }
  }

  if (!isChargesEnabled) {
    return NextResponse.json(
      { error: "This seller's Stripe payout account is still completing onboarding. Please try again shortly." },
      { status: 400 }
    );
  }

  const lineItems: NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]> = [
    {
      price_data: {
        currency: "usd",
        unit_amount: Math.round(finalPrice * 100),
        product_data: {
          name: listing.title + (appliedCoupon ? ` (${appliedCoupon.code} Applied)` : ""),
          description: `Marketplace purchase from ${listing.user.name}`,
          images: listing.images[0] ? [listing.images[0]] : [],
        },
      },
      quantity: 1,
    },
  ];

  const sessionMetadata: Record<string, string> = {
    userId: user.id,
    listingId: listing.id,
    type: "marketplace",
    couponCode: appliedCoupon?.code || "",
    refCode: refCode || "",
    sellerId: seller.id,
    sellerStripeAccountId: seller.stripeAccountId,
  };

  try {
    // Create the Checkout Session in the seller's connected account. This makes
    // the seller the merchant of record and charges Stripe's processing fee to
    // the seller's Stripe balance. The platform does not collect or transfer
    // the payment and does not take an application fee.
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: user.email ?? undefined,
        line_items: lineItems,
        success_url: `${appUrl}/${slugOrId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/${slugOrId}`,
        metadata: sessionMetadata,
        // No application_fee_amount: 100% of money belongs to seller
      },
      { stripeAccount: seller.stripeAccountId }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (directErr: any) {
    console.warn(
      "[Marketplace Checkout] Direct charge on connected account failed:",
      directErr?.message
    );
    return NextResponse.json(
      { error: "The seller's Stripe account could not start a direct checkout. Please try again after the seller completes Stripe setup." },
      { status: 502 }
    );
  }
}
