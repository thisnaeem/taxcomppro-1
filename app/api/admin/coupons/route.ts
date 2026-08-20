import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return { session, user };
}

// GET /api/admin/coupons - List coupons separated by Admin Promo Codes vs Seller Coupons
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "ALL";
  const source = searchParams.get("source") || "ALL"; // "ADMIN" | "SELLER" | "ALL"

  const coupons = await prisma.marketplaceCoupon.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { seller: { name: { contains: search, mode: "insensitive" } } },
              { seller: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(filter === "ACTIVE" ? { isActive: true } : {}),
      ...(filter === "INACTIVE" ? { isActive: false } : {}),
      ...(source === "ADMIN" ? { seller: { role: "ADMIN" } } : {}),
      ...(source === "SELLER" ? { seller: { role: { not: "ADMIN" } } } : {}),
    },
    include: {
      seller: {
        select: { id: true, name: true, email: true, role: true, image: true },
      },
      listing: {
        select: { id: true, title: true, price: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const adminCoupons = coupons.filter((c) => c.seller?.role === "ADMIN");
  const sellerCoupons = coupons.filter((c) => c.seller?.role !== "ADMIN");

  // Calculate summary metrics for Admin Platform codes
  const totalAdminCoupons = adminCoupons.length;
  const activeAdminCoupons = adminCoupons.filter((c) => c.isActive && (!c.expiresAt || new Date() <= c.expiresAt)).length;
  const totalAdminRedemptions = adminCoupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  // Calculate summary metrics for Seller codes
  const totalSellerCoupons = sellerCoupons.length;
  const activeSellerCoupons = sellerCoupons.filter((c) => c.isActive && (!c.expiresAt || new Date() <= c.expiresAt)).length;
  const totalSellerRedemptions = sellerCoupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  return NextResponse.json({
    coupons,
    adminCoupons,
    sellerCoupons,
    stats: {
      admin: {
        total: totalAdminCoupons,
        active: activeAdminCoupons,
        redemptions: totalAdminRedemptions,
      },
      seller: {
        total: totalSellerCoupons,
        active: activeSellerCoupons,
        redemptions: totalSellerRedemptions,
      },
    },
  });
}

// POST /api/admin/coupons - Create an official Admin Platform Promo Code
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const {
    code,
    discountType = "PERCENT",
    discountValue,
    appliesTo = "ALL",
    maxUses,
    expiresAt,
    isActive = true,
  } = body;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  const cleanCode = code.toUpperCase().trim();
  const numDiscount = parseFloat(discountValue);

  if (isNaN(numDiscount) || numDiscount <= 0) {
    return NextResponse.json({ error: "Discount value must be a positive number" }, { status: 400 });
  }

  if (discountType === "PERCENT" && numDiscount > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 });
  }

  // Check code uniqueness
  const existing = await prisma.marketplaceCoupon.findFirst({
    where: { code: cleanCode },
  });

  if (existing) {
    return NextResponse.json({ error: `Coupon code '${cleanCode}' already exists` }, { status: 400 });
  }

  try {
    const coupon = await prisma.marketplaceCoupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENT",
        discountValue: numDiscount,
        sellerId: admin.user.id,
        listingId: appliesTo && appliesTo !== "ALL" ? appliesTo : null,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: Boolean(isActive),
      },
      include: {
        seller: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: `Admin Platform Code ${cleanCode} created successfully!`,
    });
  } catch (error: any) {
    console.error("Failed to create admin coupon:", error);
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}
