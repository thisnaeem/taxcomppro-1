import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? user : null;
}

// GET — individual affiliate profile with full referral history & payouts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const affiliate = await prisma.affiliateProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          tier: true,
          createdAt: true,
        },
      },
      referrals: {
        include: {
          referredUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              tier: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { referrals: true, payouts: true },
      },
    },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  const globalSettings = await prisma.affiliateSettings.findFirst();

  return NextResponse.json({
    affiliate,
    globalSettings,
  });
}

// PATCH — update individual affiliate (commission rates, active status, custom code, balance adjustments)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.affiliateProfile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  const updateData: Record<string, any> = {};

  // Custom commission rate override
  if ("customCommissionRate" in body) {
    updateData.customCommissionRate =
      body.customCommissionRate === null || body.customCommissionRate === ""
        ? null
        : Math.max(0, Math.min(100, parseFloat(body.customCommissionRate)));
  }

  // Tier-specific overrides
  if ("customVip" in body) {
    updateData.customVip =
      body.customVip === null || body.customVip === ""
        ? null
        : Math.max(0, Math.min(100, parseFloat(body.customVip)));
  }
  if ("customMarketplace" in body) {
    updateData.customMarketplace =
      body.customMarketplace === null || body.customMarketplace === ""
        ? null
        : Math.max(0, Math.min(100, parseFloat(body.customMarketplace)));
  }
  if ("customPlus" in body) {
    updateData.customPlus =
      body.customPlus === null || body.customPlus === ""
        ? null
        : Math.max(0, Math.min(100, parseFloat(body.customPlus)));
  }

  // Active status toggle
  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive;
  }

  // Custom code update
  if (typeof body.code === "string" && body.code.trim()) {
    const cleanCode = body.code.trim();
    if (cleanCode !== existing.code) {
      const codeTaken = await prisma.affiliateProfile.findUnique({
        where: { code: cleanCode },
      });
      if (codeTaken) {
        return NextResponse.json({ error: "Referral code already in use" }, { status: 409 });
      }
      updateData.code = cleanCode;
    }
  }

  // Direct balance adjustment (e.g. manual credit/bonus or deduction)
  if (typeof body.balanceAdjustment === "number" && body.balanceAdjustment !== 0) {
    const adj = parseFloat(body.balanceAdjustment.toFixed(2));
    updateData.pendingBalance = { increment: adj };
    if (adj > 0) {
      updateData.totalEarned = { increment: adj };
    }
  }

  updateData.updatedAt = new Date();

  const updated = await prisma.affiliateProfile.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          tier: true,
        },
      },
      _count: { select: { referrals: true, payouts: true } },
    },
  });

  // Optional notification to the affiliate if commission rate was updated
  if ("customCommissionRate" in body && body.customCommissionRate !== null) {
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: "system",
        title: "Commission Rate Updated",
        message: `Your affiliate commission rate has been updated to ${body.customCommissionRate}%.`,
      },
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}

// POST — create a manual payout for this affiliate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const affiliate = await prisma.affiliateProfile.findUnique({ where: { id } });
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  if (body.action === "CREATE_PAYOUT") {
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
    }

    const method = body.method || "manual";
    const details = body.details || "Admin issued payout";
    const note = body.note || "Direct admin payout";
    const markAsPaid = Boolean(body.markAsPaid);

    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        method,
        details,
        status: markAsPaid ? "PAID" : "PENDING",
        note,
      },
    });

    if (markAsPaid) {
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: {
          pendingBalance: { decrement: amount },
          totalPaid: { increment: amount },
          updatedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: affiliate.userId,
          type: "upgrade",
          title: "Payout Received",
          message: `You have been paid $${amount.toFixed(2)} for your affiliate earnings.`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, payout });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
