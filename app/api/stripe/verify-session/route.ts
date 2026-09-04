import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";
import { TRAINING_TOOLKIT_IDS, DEFAULT_SEATS, LICENSE_MONTHS } from "@/lib/training";
import { ensureActiveTrainingVersion } from "@/lib/trainingServer";
import { sendMembershipUpgradedEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_VIP_PRICE_ID!]:              "VIP",
  [process.env.STRIPE_MARKETPLACE_PRICE_ID!]:      "MARKETPLACE",
  [process.env.STRIPE_MARKETPLACE_PLUS_PRICE_ID!]: "MARKETPLACE_PLUS",
};

// POST /api/stripe/verify-session
// Called on the success redirect to immediately update the DB regardless of webhook delivery
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json() as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.items.data.price"],
    });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  // Security: only allow the session owner to verify
  const { userId, tier, type } = stripeSession.metadata ?? {};
  if (userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (stripeSession.payment_status !== "paid" && stripeSession.status !== "complete")
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });

  let resolvedTier: SubscriptionTier | null = null;

  // Subscription purchase — resolve tier from price ID
  if (stripeSession.mode === "subscription") {
    const sub = stripeSession.subscription as Stripe.Subscription | null;
    const priceId = sub?.items?.data?.[0]?.price?.id ?? "";
    resolvedTier = PRICE_TO_TIER[priceId] ?? (tier as SubscriptionTier) ?? null;

    if (resolvedTier) {
      // Check if upgrade email was already sent in last 10 minutes to prevent duplicate emails
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId,
          title: "🎉 Membership Upgraded!",
          createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
      });

      await prisma.user.update({ where: { id: userId }, data: { tier: resolvedTier } });
      await prisma.subscription.upsert({
        where:  { userId },
        create: { userId, plan: resolvedTier, stripeCustomerId: stripeSession.customer as string, stripeSubscriptionId: sub?.id ?? "", status: "active" },
        update: { plan: resolvedTier, stripeSubscriptionId: sub?.id ?? "", status: "active" },
      });
      await prisma.notification.create({
        data: { userId, type: "SYSTEM", title: "🎉 Membership Upgraded!", message: `You are now on the ${resolvedTier} plan. Enjoy your new benefits!` },
      }).catch(() => {});

      if (!alreadyNotified) {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (u?.email) {
          sendMembershipUpgradedEmail({
            to: u.email,
            userName: u.name || "Member",
            tier: resolvedTier,
            currentPeriodEnd: (sub as any)?.current_period_end ? new Date((sub as any).current_period_end * 1000) : undefined,
          }).catch(err => console.error("[Verify Session] Failed to send upgrade email:", err));
        }
      }
    }
  }

  // Toolkit / bundle one-time purchase — apply upgrade ourselves (idempotent fallback for webhook)
  if (type === "toolkit" || type === "bundle") {
    const { toolkitId, membershipMonths, bundleId } = stripeSession.metadata ?? {};
    const mTier  = "VIP" as SubscriptionTier; // All toolkits grant VIP
    const months = Number(membershipMonths ?? 2);
    const tkId   = type === "toolkit" ? toolkitId : `bundle:${bundleId ?? "unknown"}`;
    const customerId = stripeSession.customer as string;

    if (tkId) {
      const existing = await prisma.toolkitPurchase.findFirst({
        where: { stripeSessionId: stripeSession.id },
      });

      if (!existing) {
        await prisma.toolkitPurchase.create({
          data: {
            userId,
            toolkitId:         tkId,
            stripeSessionId:   stripeSession.id,
            membershipGranted: true,
            membershipTier:    mTier,
            membershipMonths:  months,
          },
        });

        // Only grant membership if this toolkit includes it (months > 0)
        if (months > 0) {
          // Apply tier upgrade (never downgrade)
          const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
          const tierOrder: SubscriptionTier[] = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
          if (tierOrder.indexOf(mTier) > tierOrder.indexOf(currentUser?.tier ?? "FREE")) {
            await prisma.user.update({ where: { id: userId }, data: { tier: mTier } });
          }

          // ── Set up auto-billing VIP subscription with 60-day trial ──────────
          if (process.env.STRIPE_VIP_PRICE_ID && customerId) {
            try {
              let paymentMethodId: string | null = null;
              if (stripeSession.payment_intent) {
                const pi = await stripe.paymentIntents.retrieve(stripeSession.payment_intent as string);
                paymentMethodId = pi.payment_method as string | null;
              }
              if (paymentMethodId) {
                await stripe.customers.update(customerId, {
                  invoice_settings: { default_payment_method: paymentMethodId },
                });
              }
              const existingSub = await prisma.subscription.findUnique({ where: { userId } });
              if (!existingSub || existingSub.status === "canceled") {
                const vipSub = await stripe.subscriptions.create({
                  customer:          customerId,
                  items:             [{ price: process.env.STRIPE_VIP_PRICE_ID }],
                  trial_period_days: 60,
                  metadata:          { userId, source: "toolkit_purchase" },
                });
                await prisma.subscription.upsert({
                  where:  { userId },
                  create: { userId, plan: "VIP", stripeCustomerId: customerId, stripeSubscriptionId: vipSub.id, status: "trialing" },
                  update: { plan: "VIP", stripeSubscriptionId: vipSub.id, status: "trialing" },
                });
              }
            } catch (e) {
              console.error("verify-session: Failed to create VIP trial subscription:", e);
            }
          }

          await prisma.notification.create({
            data: {
              userId, type: "SYSTEM",
              title:   "🎉 Toolkit Purchase Complete!",
              message: `Your download is ready! You've received ${months} months of FREE VIP membership. After your trial, membership continues at $39.99/month — cancel anytime.`,
            },
          }).catch(() => {});
        } else {
          // No membership — simple digital download notification
          await prisma.notification.create({
            data: {
              userId, type: "SYSTEM",
              title:   "🎉 Purchase Complete!",
              message: "Your digital download is ready.",
            },
          }).catch(() => {});
        }
      }
    }

    resolvedTier = (await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } }))?.tier ?? "FREE";

    // ── ERO Training Center: auto-grant a 5-seat, 12-month staff training license ──
    // Idempotent (upsert on eroId+toolkitId) so it's safe to run here even if the
    // webhook already handled it, and it's the only path that fires in local dev
    // when Stripe webhooks aren't forwarded to localhost.
    if (type === "toolkit" && toolkitId && TRAINING_TOOLKIT_IDS.has(toolkitId)) {
      try {
        await ensureActiveTrainingVersion(toolkitId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + LICENSE_MONTHS);
        await prisma.trainingLicense.upsert({
          where: { eroId_toolkitId: { eroId: userId, toolkitId } },
          create: { eroId: userId, toolkitId, totalSeats: DEFAULT_SEATS, expiresAt },
          update: {},
        });
      } catch (e) {
        console.error("verify-session: Failed to create training license:", e);
      }
    }
  }

  // Course one-time purchase — idempotent fallback for webhook
  let enrolledCourseSlug: string | null = null;
  if (type === "course" && userId) {
    const { courseId, slug } = stripeSession.metadata ?? {};
    if (courseId) {
      const alreadyEnrolled = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!alreadyEnrolled) {
        await prisma.enrollment.create({ data: { userId, courseId } });
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, instructorId: true } });
        if (course) {
          await prisma.notification.create({
            data: {
              userId,
              type: "SYSTEM",
              title: "🎉 Course Purchase Complete!",
              message: `You are now enrolled in "${course.title}". Start learning now!`,
              link: `/courses/${slug ?? ""}/learn`,
            },
          }).catch(() => {});
        }
      }
      enrolledCourseSlug = slug ?? null;
    }
  }

  // Return the fresh tier so the client can update Redux
  const freshUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, role: true, name: true, email: true, image: true, bio: true, headline: true },
  });

  return NextResponse.json({ tier: freshUser?.tier ?? "FREE", user: freshUser, enrolledCourseSlug });
}
