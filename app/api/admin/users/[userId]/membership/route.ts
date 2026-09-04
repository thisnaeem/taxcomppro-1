import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";
import { sendMembershipUpgradedEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify that caller is ADMIN
  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (caller?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const months = parseInt(body.months, 10);
  let tier = body.tier as SubscriptionTier | undefined;

  if (!months || isNaN(months) || months < 1 || months > 120) {
    return NextResponse.json(
      { error: "Please enter a valid number of months (1-120)." },
      { status: 400 }
    );
  }

  const validTiers: SubscriptionTier[] = ["VIP", "MARKETPLACE", "MARKETPLACE_PLUS"];
  if (tier && !validTiers.includes(tier)) {
    return NextResponse.json(
      { error: "Invalid membership tier. Choose VIP, MARKETPLACE, or MARKETPLACE_PLUS." },
      { status: 400 }
    );
  }

  // Check target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      subscription: true,
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // If tier not specified, use target user's current tier (unless FREE, then default to VIP)
  if (!tier) {
    tier = (targetUser.tier !== "FREE" ? targetUser.tier : "VIP") as SubscriptionTier;
  }

  const now = new Date();
  const existingSub = targetUser.subscription;

  // Calculate new expiration date
  let newPeriodEnd: Date;
  if (existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now) {
    newPeriodEnd = new Date(existingSub.currentPeriodEnd);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months);
  } else {
    newPeriodEnd = new Date();
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months);
  }

  try {
    // 1. Upsert Subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: targetUser.id },
      create: {
        userId: targetUser.id,
        plan: tier,
        status: "active",
        currentPeriodEnd: newPeriodEnd,
      },
      update: {
        plan: tier,
        status: "active",
        currentPeriodEnd: newPeriodEnd,
      },
      select: {
        id: true,
        plan: true,
        status: true,
        currentPeriodEnd: true,
      },
    });

    // 2. Update User tier
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { tier },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tier: true,
      },
    });

    // 3. Record ToolkitPurchase entry for history tracking
    await prisma.toolkitPurchase.create({
      data: {
        userId: targetUser.id,
        toolkitId: "admin_free_months",
        stripeSessionId: `admin_gift_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        membershipGranted: true,
        membershipTier: tier,
        membershipMonths: months,
      },
    });

    // 4. Send notification
    const formattedDate = newPeriodEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "SYSTEM",
        title: "🎁 Free Membership Granted!",
        message: `You've been granted ${months} free months of ${tier} membership (valid until ${formattedDate}).`,
      },
    });

    if (targetUser.email) {
      sendMembershipUpgradedEmail({
        to: targetUser.email,
        userName: targetUser.name || "Member",
        tier,
        currentPeriodEnd: newPeriodEnd,
        months,
        isComplimentary: true,
      }).catch(err => console.error("[Admin Membership Email] Failed to send email:", err));
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      subscription,
      message: `Successfully added ${months} free month${months > 1 ? "s" : ""} of ${tier} membership to ${targetUser.name || targetUser.email}. Valid until ${formattedDate}.`,
    });
  } catch (error) {
    console.error("Failed to add free membership months:", error);
    return NextResponse.json(
      { error: "Failed to add free membership months." },
      { status: 500 }
    );
  }
}
