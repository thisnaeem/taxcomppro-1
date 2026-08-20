import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? user : null;
}

// GET — all affiliate profiles with stats
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const affiliates = await prisma.affiliateProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { referrals: true, payouts: true } },
    },
    orderBy: { totalEarned: "desc" },
  });

  return NextResponse.json(affiliates);
}

// PATCH — quick update for single affiliate from list view
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, customCommissionRate, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "Affiliate ID required" }, { status: 400 });
  }

  const updateData: Record<string, any> = { updatedAt: new Date() };

  if ("customCommissionRate" in body) {
    updateData.customCommissionRate =
      customCommissionRate === null || customCommissionRate === ""
        ? null
        : Math.max(0, Math.min(100, parseFloat(customCommissionRate)));
  }

  if (typeof isActive === "boolean") {
    updateData.isActive = isActive;
  }

  const updated = await prisma.affiliateProfile.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { referrals: true, payouts: true } },
    },
  });

  return NextResponse.json(updated);
}
