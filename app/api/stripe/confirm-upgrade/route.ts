import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Called from dashboard when ?upgraded=1&session_id=... is present
// Verifies the Stripe checkout session and updates user tier directly — no webhook needed
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  let checkoutSession: Stripe.Checkout.Session;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  // Verify payment succeeded
  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  // Verify this session belongs to the calling user
  const userId = checkoutSession.metadata?.userId;
  if (userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tier = checkoutSession.metadata?.tier as SubscriptionTier;
  if (!tier) return NextResponse.json({ error: "No tier in metadata" }, { status: 400 });

  // Update user tier in DB
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { tier },
    select: { id: true, email: true, name: true, role: true, tier: true, image: true, bio: true, headline: true },
  });

  // Upsert subscription record
  const sub = checkoutSession.subscription as Stripe.Subscription | null;
  if (sub) {
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId, plan: tier, status: sub.status,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: sub.id,
      },
      update: {
        plan: tier, status: sub.status,
        stripeSubscriptionId: sub.id,
      },
    });
  }

  // ── Credit affiliate referral ───────────────────────────────
  const referralCode = checkoutSession.metadata?.referralCode;
  if (referralCode) {
    try {
      const affiliateProfile = await prisma.affiliateProfile.findUnique({
        where: { code: referralCode },
      });

      // Don't allow self-referral
      if (affiliateProfile && affiliateProfile.userId !== userId) {
        // Check not already credited for this user
        const alreadyCredited = await prisma.affiliateReferral.findFirst({
          where: { referredUserId: userId },
        });

        if (!alreadyCredited) {
          // Get commission rates (custom affiliate overrides take priority over global settings)
          const settings = await prisma.affiliateSettings.findFirst();
          
          let ratePercent = affiliateProfile.customCommissionRate ?? null;
          if (tier === "VIP" && affiliateProfile.customVip != null) ratePercent = affiliateProfile.customVip;
          if (tier === "MARKETPLACE" && affiliateProfile.customMarketplace != null) ratePercent = affiliateProfile.customMarketplace;
          if (tier === "MARKETPLACE_PLUS" && affiliateProfile.customPlus != null) ratePercent = affiliateProfile.customPlus;
          
          if (ratePercent == null) {
            const rateMap: Record<string, number> = {
              VIP:              settings?.commissionVip         ?? 10,
              MARKETPLACE:      settings?.commissionMarketplace ?? 15,
              MARKETPLACE_PLUS: settings?.commissionPlus        ?? 20,
            };
            ratePercent = rateMap[tier] ?? 10;
          }

          const prices: Record<string, number> = {
            VIP: 39.99, MARKETPLACE: 79.99, MARKETPLACE_PLUS: 129.99,
          };
          const rate       = ratePercent / 100;
          const price      = prices[tier] ?? 39.99;
          const commission = parseFloat((price * rate).toFixed(2));

          // Create referral record
          await prisma.affiliateReferral.create({
            data: {
              affiliateId:    affiliateProfile.id,
              referredUserId: userId,
              tier:           tier as SubscriptionTier,
              commission,
            },
          });

          // Update affiliate balance
          await prisma.affiliateProfile.update({
            where: { id: affiliateProfile.id },
            data: {
              totalEarned:    { increment: commission },
              pendingBalance: { increment: commission },
              updatedAt:      new Date(),
            },
          });

          // Notify affiliate
          await prisma.notification.create({
            data: {
              userId:  affiliateProfile.userId,
              type:    "upgrade",
              title:   "Affiliate Commission Earned!",
              message: `You earned $${commission.toFixed(2)} commission from a ${tier.replace("_", " ")} referral.`,
            },
          });
        }
      }
    } catch {
      // Don't fail upgrade if affiliate credit fails
    }
  }

  return NextResponse.json(updated);
}
