import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { hasNetworkMembership } from "@/lib/networkAccess";
import { auth } from "@/lib/auth";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/pro-networks/[slug]/checkout - Join and subscribe to Pro Network
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            stripeAccountId: true,
            stripeOnboarded: true,
            role: true,
          },
        },
      },
    });

    if (!network) {
      return NextResponse.json({ error: "Pro Network not found" }, { status: 404 });
    }

    const userId = session.user.id;

    // Check if user is already an active member or the owner
    if (network.ownerId === userId) {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        redirectUrl: `/pro-networks/${slug}`,
      });
    }

    const existingMember = await prisma.proNetworkMember.findUnique({
      where: {
        networkId_userId: {
          networkId: network.id,
          userId,
        },
      },
    });

    if (hasNetworkMembership(existingMember)) {
      return NextResponse.json({
        success: true,
        alreadyMember: true,
        redirectUrl: `/pro-networks/${slug}`,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If network is free ($0), activate immediately
    if (network.monthlyPrice <= 0) {
      await prisma.proNetworkMember.upsert({
        where: {
          networkId_userId: {
            networkId: network.id,
            userId,
          },
        },
        create: {
          networkId: network.id,
          userId,
          role: "MEMBER",
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
          joinedAt: new Date(),
          expiresAt: null,
        },
      });

      await prisma.proNetwork.update({
        where: { id: network.id },
        data: { memberCount: { increment: 1 } },
      });

      await prisma.notification.create({
        data: {
          userId: network.ownerId,
          type: "SYSTEM",
          title: "🎉 New Pro Network Member!",
          message: `${session.user.name || "A new member"} joined your Pro Network: ${network.name}`,
          link: `/pro-networks/${slug}`,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        redirectUrl: `/pro-networks/${slug}?joined=1`,
      });
    }

    // If Stripe is configured, create Checkout Session (0% TCP platform fee -> 100% to Host)
    if (stripe) {
      try {
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          payment_method_types: ["card"],
          mode: "subscription",
          customer_email: session.user.email,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${network.name} — Monthly Membership`,
                  description: network.tagline || `Exclusive access to ${network.name} on Tax Compliance Pro`,
                  images: network.coverImage ? [network.coverImage] : undefined,
                },
                unit_amount: Math.round(network.monthlyPrice * 100),
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            type: "pro_network_sub",
            networkId: network.id,
            networkSlug: network.slug,
            userId,
            ownerId: network.ownerId,
          },
          success_url: `${appUrl}/pro-networks/${slug}?joined=1&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/pro-networks/${slug}`,
        };

        // Verify charges_enabled with Stripe if not yet flagged in DB
        let isChargesEnabled = network.owner?.stripeOnboarded;
        if (!isChargesEnabled && network.owner?.stripeAccountId) {
          try {
            const acct = await stripe.accounts.retrieve(network.owner.stripeAccountId);
            if (acct.charges_enabled) {
              isChargesEnabled = true;
              await prisma.user.update({
                where: { id: network.ownerId },
                data: { stripeOnboarded: true },
              }).catch(() => {});
            }
          } catch (err: any) {
            console.warn("[Pro Network Checkout] Failed to check owner account status:", err?.message);
          }
        }

        if (!network.owner?.stripeAccountId) {
          return NextResponse.json(
            { error: "This Pro Network host has not yet connected their Stripe payout account to receive membership payments. Subscriptions are paused until setup is complete." },
            { status: 400 }
          );
        }

        if (!isChargesEnabled) {
          return NextResponse.json(
            { error: "This Pro Network host's Stripe payout account is still completing onboarding. Please try again shortly." },
            { status: 400 }
          );
        }

        // Create the subscription in the host's connected account. The host is
        // the merchant of record and pays Stripe's processing fees directly;
        // the platform never receives or transfers the membership payment.
        const stripeSession = await stripe.checkout.sessions.create(
          sessionParams,
          { stripeAccount: network.owner.stripeAccountId }
        );
        return NextResponse.json({ url: stripeSession.url });
      } catch (stripeError: any) {
        console.error("Stripe subscription checkout creation failed:", stripeError);
        return NextResponse.json(
          { error: stripeError?.message || "Failed to start checkout session." },
          { status: 500 }
        );
      }
    }

    // Fallback direct activation for development or test environment
    await prisma.proNetworkMember.upsert({
      where: {
        networkId_userId: {
          networkId: network.id,
          userId,
        },
      },
      create: {
        networkId: network.id,
        userId,
        role: "MEMBER",
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    await prisma.proNetwork.update({
      where: { id: network.id },
      data: { memberCount: { increment: 1 } },
    });

    await prisma.notification.create({
      data: {
        userId: network.ownerId,
        type: "SYSTEM",
        title: "🎉 New Pro Network Member!",
        message: `${session.user.name || "A new member"} joined your Pro Network: ${network.name}`,
        link: `/pro-networks/${slug}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      redirectUrl: `${appUrl}/pro-networks/${slug}?joined=1`,
    });
  } catch (error) {
    console.error("Pro Network checkout error:", error);
    return NextResponse.json({ error: "Failed to process enrollment" }, { status: 500 });
  }
}
