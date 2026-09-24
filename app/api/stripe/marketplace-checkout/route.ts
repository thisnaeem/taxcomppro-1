import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { listingId, listingIds, couponCode, refCode } = body as {
    listingId?: string;
    listingIds?: string[];
    couponCode?: string;
    refCode?: string;
  };

  const rawIds = listingIds && Array.isArray(listingIds) && listingIds.length > 0
    ? listingIds
    : listingId
    ? [listingId]
    : [];

  if (rawIds.length === 0) {
    return NextResponse.json({ error: "No listings specified for checkout" }, { status: 400 });
  }

  // Fetch all requested listings
  const listings = await prisma.marketplaceListing.findMany({
    where: { id: { in: rawIds } },
    include: { user: { select: { id: true, name: true, stripeAccountId: true, stripeOnboarded: true, email: true } } },
  });

  if (listings.length === 0) {
    return NextResponse.json({ error: "No matching listings found" }, { status: 404 });
  }

  // Filter out demo listings
  const validListings = listings.filter((l) => {
    if (l.metadata && typeof l.metadata === "object" && !Array.isArray(l.metadata) && (l.metadata as any).isDemo) {
      return false;
    }
    return true;
  });

  if (validListings.length === 0) {
    return NextResponse.json({ error: "Demo listings cannot be purchased" }, { status: 400 });
  }

  // Filter out listings where current user is seller
  const purchasableListings = validListings.filter((l) => l.userId !== session.user.id);
  if (purchasableListings.length === 0) {
    return NextResponse.json({ error: "You cannot purchase your own listing" }, { status: 400 });
  }

  // Check which items are already purchased
  const alreadyPurchased = await prisma.marketplacePurchase.findMany({
    where: {
      userId: session.user.id,
      listingId: { in: purchasableListings.map((l) => l.id) },
    },
    select: { listingId: true },
  });
  const alreadyPurchasedSet = new Set(alreadyPurchased.map((p) => p.listingId));

  const itemsToBuy = purchasableListings.filter((l) => !alreadyPurchasedSet.has(l.id));
  if (itemsToBuy.length === 0) {
    return NextResponse.json({ alreadyPurchased: true, message: "All items in cart have already been purchased" });
  }

  // Calculate pricing & apply coupon if single item or global
  let totalAmount = 0;
  const lineItems: NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]> = [];
  const freeListingIds: string[] = [];
  const paidListings: typeof itemsToBuy = [];

  for (const listing of itemsToBuy) {
    let finalPrice = listing.price || 0;

    // Apply Coupon if single item or seller matches
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
          if (coupon.discountType === "PERCENT") {
            const discount = (finalPrice * coupon.discountValue) / 100;
            finalPrice = Math.max(0, finalPrice - discount);
          } else {
            finalPrice = Math.max(0, finalPrice - coupon.discountValue);
          }
          finalPrice = Math.round(finalPrice * 100) / 100;

          await prisma.marketplaceCoupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          }).catch(() => {});
        }
      }
    }

    if (finalPrice <= 0) {
      freeListingIds.push(listing.id);
    } else {
      totalAmount += finalPrice;
      paidListings.push(listing);
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(finalPrice * 100),
          product_data: {
            name: listing.title,
            description: `Marketplace purchase from ${listing.user?.name || "Tax Compliance Pro Member"}`,
            images: listing.images[0] ? [listing.images[0]] : [],
          },
        },
        quantity: 1,
      });
    }
  }

  // Track referral if provided
  if (refCode && totalAmount > 0) {
    await prisma.marketplaceReferral.updateMany({
      where: { code: refCode.toUpperCase().trim() },
      data: {
        conversions: { increment: 1 },
        earningsUsd: { increment: Math.round(totalAmount * 0.1 * 100) / 100 },
      },
    }).catch(() => {});
  }

  // Provision any free listings immediately
  for (const freeId of freeListingIds) {
    await prisma.marketplacePurchase.upsert({
      where: { userId_listingId: { userId: session.user.id, listingId: freeId } },
      create: { userId: session.user.id, listingId: freeId, price: 0 },
      update: {},
    }).catch(() => {});

    const freeListing = itemsToBuy.find((l) => l.id === freeId);
    if (freeListing) {
      await prisma.notification.create({
        data: {
          userId: freeListing.userId,
          type: "SYSTEM",
          title: "💰 Listing Acquired!",
          message: `Someone claimed your free listing: ${freeListing.title}`,
          link: `/${freeListing.slug ?? freeListing.id}`,
        },
      }).catch(() => {});
    }
  }

  // If everything was free
  if (paidListings.length === 0) {
    return NextResponse.json({ success: true, isFree: true, count: freeListingIds.length });
  }

  // Paid listings: Create Stripe Checkout Session
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isSingleItem = paidListings.length === 1 && freeListingIds.length === 0;
  const singleListing = paidListings[0];
  const primarySlugOrId = isSingleItem ? (singleListing.slug || singleListing.id) : "marketplace";

  const sessionMetadata: Record<string, string> = {
    userId: user.id,
    type: "marketplace",
    listingIds: paidListings.map((l) => l.id).join(","),
    listingId: singleListing.id,
    itemCount: String(paidListings.length),
    couponCode: couponCode || "",
    refCode: refCode || "",
  };

  // If single item and seller has direct Stripe connected account enabled
  if (isSingleItem && singleListing.user?.stripeAccountId) {
    const seller = singleListing.user;
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
        console.warn("[Marketplace Checkout] Check seller account status failed:", err?.message);
      }
    }

    if (isChargesEnabled) {
      try {
        const checkoutSession = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: user.email ?? undefined,
            line_items: lineItems,
            success_url: `${appUrl}/marketplace?view=purchases&checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/${primarySlugOrId}`,
            metadata: {
              ...sessionMetadata,
              sellerId: seller.id,
              sellerStripeAccountId: seller.stripeAccountId,
            },
          },
          { stripeAccount: seller.stripeAccountId || undefined }
        );
        return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
      } catch (directErr: any) {
        console.warn("[Marketplace Checkout] Direct connect charge failed, falling back to platform checkout:", directErr?.message);
      }
    }
  }

  // Platform Stripe Checkout Session (for multi-item carts, or sellers completing onboarding)
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: lineItems,
      success_url: `${appUrl}/marketplace?view=purchases&checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/marketplace`,
      metadata: sessionMetadata,
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (err: any) {
    console.error("[Marketplace Checkout] Stripe checkout failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to initiate Stripe checkout" },
      { status: 500 }
    );
  }
}
