import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, tier: true } },
    },
  });

  // Tier breakdown with revenue
  const tierBreakdown = Object.entries(PLAN_PRICE).map(([plan, price]) => {
    const planSubs = subscriptions.filter(s => s.plan === plan && s.status === "active");
    return { plan, count: planSubs.length, monthlyRevenue: planSubs.length * price };
  });

  const activeCount   = subscriptions.filter(s => s.status === "active").length;
  const canceledCount = subscriptions.filter(s => s.status === "canceled").length;

  const totalMRR = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);

  // Monthly revenue buckets for the last 6 months
  const now = new Date();
  const monthlyRevenue: { month: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthSubs = subscriptions.filter(s => {
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
    subscriptions,
    tierBreakdown,
    totalMRR,
    totalARR: totalMRR * 12,
    activeCount,
    canceledCount,
    totalCount: subscriptions.length,
    monthlyRevenue,
  });
}
