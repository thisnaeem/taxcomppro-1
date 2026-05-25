import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_VIP_PRICE_ID!]:              "VIP",
  [process.env.STRIPE_MARKETPLACE_PRICE_ID!]:      "MARKETPLACE",
  [process.env.STRIPE_MARKETPLACE_PLUS_PRICE_ID!]: "MARKETPLACE_PLUS",
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, tier, type, toolkitId, membershipTier, membershipMonths } = session.metadata ?? {};

    // ── Toolkit one-time purchase ──────────────────────────
    if (type === "toolkit" && userId && toolkitId) {
      const mTier  = "VIP" as SubscriptionTier; // All toolkits grant VIP
      const months = Number(membershipMonths ?? 2);
      const customerId = session.customer as string;

      await prisma.toolkitPurchase.create({
        data: { userId, toolkitId, stripeSessionId: session.id, membershipGranted: true, membershipTier: mTier, membershipMonths: months },
      });

      // Only grant membership if this toolkit includes it
      if (months > 0) {
        const tierOrder: SubscriptionTier[] = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
        const currentTierRank = tierOrder.indexOf(user?.tier ?? "FREE");
        const vipRank = tierOrder.indexOf(mTier);

        // Only upgrade tier if current tier is lower than VIP (i.e., FREE only)
        if (vipRank > currentTierRank) {
          await prisma.user.update({ where: { id: userId }, data: { tier: mTier } });
        }

        // ── Set up auto-billing VIP subscription with 60-day trial ────────────
        // ONLY if user does NOT already have Marketplace or Marketplace Plus
        const isHigherPlan = currentTierRank >= tierOrder.indexOf("MARKETPLACE");
        if (!isHigherPlan && process.env.STRIPE_VIP_PRICE_ID && customerId) {
          try {
            let paymentMethodId: string | null = null;
            if (session.payment_intent) {
              const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
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
                customer: customerId,
                items: [{ price: process.env.STRIPE_VIP_PRICE_ID }],
                trial_period_days: 60,
                metadata: { userId, source: "toolkit_purchase" },
              });
              await prisma.subscription.upsert({
                where:  { userId },
                create: { userId, plan: "VIP", stripeCustomerId: customerId, stripeSubscriptionId: vipSub.id, status: "trialing" },
                update: { plan: "VIP", stripeSubscriptionId: vipSub.id, status: "trialing" },
              });
            }
          } catch (e) {
            console.error("Failed to create VIP trial subscription:", e);
          }
        }
      }

      // Notification message varies: VIP granted vs higher plan retained
      const user2 = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
      const tierOrder2: SubscriptionTier[] = ["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
      const hadHigherPlan = tierOrder2.indexOf(user2?.tier ?? "FREE") > tierOrder2.indexOf("VIP");
      await prisma.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          title: "🎉 Toolkit Purchase Complete!",
          message: hadHigherPlan
            ? `Your download is ready! Your current ${user2?.tier} membership has been retained.`
            : `Your download is ready! You've received ${months} months of FREE VIP membership. After your trial, membership continues at $39.99/month — cancel anytime.`,
        },
      });
    }


    // ── Pro Talk Host purchase (one-time $99.99) ──────────────────────
    if (type === "pro_talk_host" && userId) {
      await prisma.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          title: "🎙️ Pro Talk Hosting Unlocked!",
          message: "Your $99.99 payment is confirmed. You can now host a Pro Talk audio room. Go to Pro Talks to start your session.",
          link: "/pro-talks",
        },
      });
    }

    // ── Course one-time purchase ───────────────────────────
    if (type === "course" && userId) {
      const { courseId, slug } = session.metadata ?? {};
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
                userId: course.instructorId,
                type: "ENROLLMENT",
                title: "New Paid Enrollment",
                message: `Someone purchased your course: ${course.title}`,
                link: `/courses/${slug ?? ""}`,
              },
            }).catch(() => {});
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
      }
    }

    if (type === "bundle" && userId) {
      const { bundleId } = session.metadata ?? {};
      const mTier  = (membershipTier ?? "MARKETPLACE_PLUS") as SubscriptionTier;
      const months = Number(membershipMonths ?? 3);

      // Record as a special toolkit purchase with id "bundle:{bundleId}"
      await prisma.toolkitPurchase.create({
        data: { userId, toolkitId: `bundle:${bundleId ?? "unknown"}`, stripeSessionId: session.id, membershipGranted: true, membershipTier: mTier, membershipMonths: months },
      });

      // Always upgrade to MARKETPLACE_PLUS for bundle
      await prisma.user.update({ where: { id: userId }, data: { tier: mTier } });

      await prisma.notification.create({
        data: { userId, type: "SYSTEM", title: "🎉 Bundle Purchase Complete!", message: `Welcome to ${mTier}! You've received ${months} months of premium membership and all included toolkits.` },
      });
    }

    // ── Subscription upgrade ──────────────────────────────
    if (type !== "toolkit" && userId && tier) {
      const t = tier as SubscriptionTier;
      await prisma.user.update({ where: { id: userId }, data: { tier: t } });
      await prisma.subscription.upsert({
        where:  { userId },
        create: { userId, plan: t, stripeCustomerId: session.customer as string, stripeSubscriptionId: session.subscription as string, status: "active" },
        update: { plan: t, stripeSubscriptionId: session.subscription as string, status: "active" },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const existingSub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
    if (existingSub) {
      await prisma.user.update({ where: { id: existingSub.userId }, data: { tier: "FREE" } });
      await prisma.subscription.update({ where: { id: existingSub.id }, data: { status: "canceled", plan: "FREE" } });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub     = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0]?.price.id;
    const t       = PRICE_TO_TIER[priceId] ?? "FREE";
    const existing = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.userId }, data: { tier: t } });
      await prisma.subscription.update({ where: { id: existing.id }, data: { plan: t, status: sub.status } });
    }
  }

  return NextResponse.json({ received: true });
}
