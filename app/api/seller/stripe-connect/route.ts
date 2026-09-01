import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
const ALLOWED_TIERS = ["MARKETPLACE", "MARKETPLACE_PLUS"];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// GET — return connection status + account details
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true, stripeOnboarded: true, tier: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let accountDetails = null;
  if (user.stripeAccountId) {
    try {
      const acct = await stripe.accounts.retrieve(user.stripeAccountId);
      const onboarded = !!(acct.charges_enabled && acct.details_submitted);

      // Sync onboarding status to DB if it changed
      if (onboarded !== user.stripeOnboarded) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeOnboarded: onboarded },
        });
      }

      accountDetails = {
        id: acct.id,
        email: acct.email,
        country: acct.country,
        chargesEnabled: acct.charges_enabled,
        payoutsEnabled: acct.payouts_enabled,
        onboarded,
      };
    } catch {
      // Account may have been deleted on Stripe side; clear DB
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: null, stripeOnboarded: false },
      });
    }
  }

  return NextResponse.json({
    connected: !!user.stripeAccountId,
    onboarded: user.stripeOnboarded,
    accountId: user.stripeAccountId,
    accountDetails,
  });
}

// POST — create Express account + return onboarding link
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { returnUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is acceptable
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true, stripeOnboarded: true, tier: true, role: true, email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let accountId = user.stripeAccountId;

  // Create a new Express account if none exists
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: user.name ?? undefined,
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: accountId },
    });
  }

  const targetReturnPath = body.returnUrl || "/seller-dashboard";
  const separator = targetReturnPath.includes("?") ? "&" : "?";

  // Generate a fresh Account Link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}${targetReturnPath}${separator}stripe=refresh`,
    return_url:  `${APP_URL}${targetReturnPath}${separator}stripe=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

// DELETE — disconnect Stripe account
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { stripeAccountId: null, stripeOnboarded: false },
  });

  return NextResponse.json({ success: true });
}
