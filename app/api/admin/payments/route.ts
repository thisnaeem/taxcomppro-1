import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLKITS } from "@/lib/toolkits";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return null;
  return session;
}

// Monthly pricing per plan (USD)
const PLAN_PRICE: Record<string, number> = {
  FREE:             0,
  VIP:              29,
  MARKETPLACE:      49,
  MARKETPLACE_PLUS: 99,
};

function computeNextBilling(currentPeriodEnd: Date | string | null, createdAt: Date | string): string {
  if (currentPeriodEnd) {
    const end = new Date(currentPeriodEnd);
    if (end > new Date()) return end.toISOString();
  }
  const created = new Date(createdAt);
  const now = new Date();
  const next = new Date(created);
  while (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 1. Fetch all subscription records
  const dbSubs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, tier: true } },
    },
  });

  // 2. Fetch all users with a paid tier
  const paidUsers = await prisma.user.findMany({
    where: { tier: { not: "FREE" } },
    select: { id: true, name: true, email: true, image: true, tier: true, createdAt: true },
  });

  const subUserIds = new Set(dbSubs.map((s) => s.userId));

  // Synthesize active subscription items for paid users without an explicit subscription row
  const syntheticSubs = paidUsers
    .filter((u) => !subUserIds.has(u.id))
    .map((u) => ({
      id: `syn_${u.id}`,
      userId: u.id,
      plan: u.tier,
      status: "active",
      currentPeriodEnd: null,
      nextBilling: computeNextBilling(null, u.createdAt),
      createdAt: u.createdAt.toISOString(),
      stripeSubscriptionId: null,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        tier: u.tier,
      },
    }));

  const allSubscriptions = [
    ...dbSubs.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd ? s.currentPeriodEnd.toISOString() : null,
      nextBilling: computeNextBilling(s.currentPeriodEnd, s.createdAt),
    })),
    ...syntheticSubs,
  ];

  // 3. Fetch all Toolkit & Course Purchases (Transactions)
  const dbPurchases = await prisma.toolkitPurchase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, tier: true } },
    },
  });

  const toolkitMap = new Map(TOOLKITS.map((t) => [t.id, t]));

  const transactions = dbPurchases.map((p) => {
    const tk = toolkitMap.get(p.toolkitId);
    let amount = tk?.price ?? 299.99;
    let label = tk?.name ?? p.toolkitId.replace(/[-_:]+/g, " ").toUpperCase();
    if (p.toolkitId === "admin_free_months") {
      amount = 0;
      label = "Admin Free Membership Credit";
    }

    return {
      id: p.id,
      userId: p.userId,
      toolkitId: p.toolkitId,
      productName: label,
      amount,
      status: "paid",
      stripeSessionId: p.stripeSessionId,
      membershipGranted: p.membershipGranted,
      membershipTier: p.membershipTier,
      membershipMonths: p.membershipMonths,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    };
  });

  // 4. Tier breakdown with revenue
  const tierBreakdown = Object.entries(PLAN_PRICE).map(([plan, price]) => {
    const planSubs = allSubscriptions.filter((s) => s.plan === plan && s.status === "active");
    return { plan, count: planSubs.length, monthlyRevenue: planSubs.length * price };
  });

  const activeCount = allSubscriptions.filter((s) => s.status === "active").length;
  const canceledCount = allSubscriptions.filter((s) => s.status === "canceled").length;

  const totalMRR = allSubscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);

  // 5. Monthly revenue buckets for the last 6 months
  const now = new Date();
  const monthlyRevenue: { month: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthSubs = allSubscriptions.filter((s) => {
      const created = new Date(s.createdAt);
      return created >= d && created < end && s.status === "active";
    });
    monthlyRevenue.push({
      month: d.toLocaleString("default", { month: "short" }),
      revenue: monthSubs.reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0),
      count: monthSubs.length,
    });
  }

  return NextResponse.json({
    subscriptions: allSubscriptions,
    transactions,
    tierBreakdown,
    totalMRR,
    totalARR: totalMRR * 12,
    activeCount,
    canceledCount,
    totalCount: allSubscriptions.length,
    monthlyRevenue,
  });
}
