import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, couponCode, refCode } = (await req.json()) as {
    slug: string;
    couponCode?: string;
    refCode?: string;
  };
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const course = await prisma.course.findUnique({
    where: { slug },
  });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // If user is instructor or admin, they already have full access
  if (course.instructorId === session.user.id || session.user.role === "ADMIN") {
    return NextResponse.json({ error: "You are the instructor / admin of this course", alreadyEnrolled: true }, { status: 400 });
  }

  // Already enrolled?
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });
  if (existing) return NextResponse.json({ error: "Already enrolled", alreadyEnrolled: true }, { status: 400 });

  let finalPrice = course.isFree ? 0 : course.price;
  let appliedCoupon = null;

  // Apply Coupon if provided
  if (couponCode && finalPrice > 0) {
    const coupon = await prisma.marketplaceCoupon.findFirst({
      where: {
        code: couponCode.toUpperCase().trim(),
        sellerId: course.instructorId,
        isActive: true,
      },
    });

    if (coupon) {
      const isValidTime = !coupon.expiresAt || new Date() <= coupon.expiresAt;
      const isValidUses = coupon.maxUses == null || coupon.usedCount < coupon.maxUses;

      if (isValidTime && isValidUses) {
        appliedCoupon = coupon;
        if (coupon.discountType === "PERCENT") {
          const discount = (finalPrice * coupon.discountValue) / 100;
          finalPrice = Math.max(0, finalPrice - discount);
        } else {
          finalPrice = Math.max(0, finalPrice - coupon.discountValue);
        }
        finalPrice = Math.round(finalPrice * 100) / 100;

        // Increment coupon usage
        await prisma.marketplaceCoupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        }).catch(() => {});
      }
    }
  }

  // Track referral conversion if code passed
  if (refCode) {
    await prisma.marketplaceReferral.updateMany({
      where: { code: refCode.toUpperCase().trim() },
      data: {
        conversions: { increment: 1 },
        earningsUsd: { increment: Math.round(finalPrice * 0.1 * 100) / 100 },
      },
    }).catch(() => {});
  }

  // If free course or 100% coupon discount, enroll immediately
  if (finalPrice <= 0) {
    await prisma.enrollment.create({
      data: { userId: session.user.id, courseId: course.id },
    });
    return NextResponse.json({ success: true, isFree: true });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Create / retrieve Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name ?? "" });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const instructor = await prisma.user.findUnique({
    where: { id: course.instructorId },
    select: { stripeAccountId: true, stripeOnboarded: true, role: true },
  });

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(finalPrice * 100),
          product_data: {
            name: course.title + (appliedCoupon ? ` (${appliedCoupon.code} Applied)` : ""),
            description: `Full access to "${course.title}"`,
            images: course.thumbnail ? [course.thumbnail] : [],
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${slug}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${slug}`,
    metadata: {
      type: "course",
      userId: user.id,
      courseId: course.id,
      slug,
      couponCode: appliedCoupon?.code || "",
      refCode: refCode || "",
    },
  };

  // If creator connected their Stripe account, route payments directly to them
  if (instructor?.stripeAccountId && instructor.stripeOnboarded && instructor.role !== "ADMIN") {
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: instructor.stripeAccountId,
      },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: checkoutSession.url });
}
