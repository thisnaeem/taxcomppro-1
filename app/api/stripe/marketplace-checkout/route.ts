import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await req.json() as { listingId: string };
  if (!listingId) return NextResponse.json({ error: "Listing ID required" }, { status: 400 });

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

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

  // If free listing, record purchase immediately
  if (!listing.price || listing.price <= 0) {
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

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name ?? "" });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const slugOrId = listing.slug || listing.id;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: Math.round(listing.price * 100),
        product_data: {
          name: listing.title,
          description: `Marketplace purchase from ${listing.user.name}`,
          images: listing.images[0] ? [listing.images[0]] : [],
        },
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/${slugOrId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/${slugOrId}`,
    metadata: {
      userId:    user.id,
      listingId: listing.id,
      type:      "marketplace",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
