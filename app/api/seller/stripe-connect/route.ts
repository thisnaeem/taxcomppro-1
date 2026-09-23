import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  return new Stripe(secretKey);
}

function getBaseUrl(req: NextRequest): string {
  const originHeader = req.headers.get("origin");
  if (originHeader) return originHeader.replace(/\/$/, "");

  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  return "https://taxcomppro.com";
}

// GET — return connection status + account details
export async function GET() {
  try {
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
        const stripe = getStripe();
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
      } catch (err: any) {
        console.warn("Account could not be retrieved from Stripe, clearing DB reference:", err?.message);
        // Account may have been deleted on Stripe side or invalid in this mode; clear DB
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
  } catch (err: any) {
    console.error("GET /api/seller/stripe-connect error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// POST — create Express account + return onboarding link
export async function POST(req: NextRequest) {
  try {
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
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const stripe = getStripe();
    let accountId = user.stripeAccountId;

    // Verify existing account if stored
    if (accountId) {
      try {
        const existingAcct = await stripe.accounts.retrieve(accountId);
        if (!existingAcct.capabilities?.card_payments || existingAcct.capabilities.card_payments === "inactive") {
          await stripe.accounts.update(accountId, {
            capabilities: {
              transfers: { requested: true },
              card_payments: { requested: true },
            },
          }).catch((err) => console.warn("Could not request card_payments capability:", err?.message));
        }
      } catch (checkErr: any) {
        console.warn("Existing Stripe account is invalid or missing in Stripe, resetting:", checkErr?.message);
        accountId = null;
        await prisma.user.update({
          where: { id: session.user.id },
          data: { stripeAccountId: null, stripeOnboarded: false },
        });
      }
    }

    // Create a new connected account if none exists (using Accounts v2 controller)
    if (!accountId) {
      let account: Stripe.Account;
      try {
        // Accounts v2: Marketplace model with Express dashboard, application fee/loss liability, and destination transfers
        account = await stripe.accounts.create({
          controller: {
            fees: { payer: "application" },
            losses: { payments: "application" },
            stripe_dashboard: { type: "express" },
            requirement_collection: "stripe",
          },
          email: user.email ?? undefined,
          business_profile: {
            name: user.name ?? undefined,
          },
          capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true },
          },
        });
      } catch (v2Err: any) {
        console.warn("Accounts v2 create attempt 1 failed, trying fallback without capabilities:", v2Err?.message);
        try {
          // Fallback A: controller without explicit capabilities
          account = await stripe.accounts.create({
            controller: {
              fees: { payer: "application" },
              losses: { payments: "application" },
              stripe_dashboard: { type: "express" },
              requirement_collection: "stripe",
            },
            email: user.email ?? undefined,
            business_profile: {
              name: user.name ?? undefined,
            },
          });
        } catch (v2Err2: any) {
          console.warn("Accounts v2 create attempt 2 failed, trying managed risk fallback:", v2Err2?.message);
          // Fallback B: If platform requires Managed Risk (losses: stripe)
          account = await stripe.accounts.create({
            controller: {
              losses: { payments: "stripe" },
              stripe_dashboard: { type: "full" },
            },
            email: user.email ?? undefined,
            business_profile: {
              name: user.name ?? undefined,
            },
          });
        }
      }

      accountId = account.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const baseUrl = getBaseUrl(req);
    const targetReturnPath = body.returnUrl || "/seller-dashboard";
    const separator = targetReturnPath.includes("?") ? "&" : "?";

    const refreshUrl = `${baseUrl}${targetReturnPath}${separator}stripe=refresh`;
    const returnUrl = `${baseUrl}${targetReturnPath}${separator}stripe=success`;

    // Generate a fresh Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("POST /api/seller/stripe-connect error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start Stripe onboarding." },
      { status: 500 }
    );
  }
}

// DELETE — disconnect Stripe account
export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeAccountId: null, stripeOnboarded: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/seller/stripe-connect error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to disconnect Stripe account." },
      { status: 500 }
    );
  }
}
