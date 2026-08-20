import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupons = await prisma.marketplaceCoupon.findMany({
    where: { sellerId: session.user.id },
    include: {
      listing: { select: { id: true, title: true, slug: true, category: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const code = (body.code || "").toUpperCase().trim().replace(/[^A-Z0-9_-]/g, "");

  if (!code || code.length < 2) {
    return NextResponse.json({ error: "Please enter a valid coupon code (min 2 letters/digits)" }, { status: 400 });
  }

  const discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENT";
  const discountValue = Number(body.discountValue) || 0;

  if (discountValue <= 0) {
    return NextResponse.json({ error: "Discount value must be greater than 0" }, { status: 400 });
  }

  if (discountType === "PERCENT" && discountValue > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 });
  }

  const existing = await prisma.marketplaceCoupon.findUnique({
    where: { sellerId_code: { sellerId: session.user.id, code } },
  });

  if (existing) {
    return NextResponse.json({ error: "You already have a coupon with this code" }, { status: 409 });
  }

  const coupon = await prisma.marketplaceCoupon.create({
    data: {
      code,
      discountType,
      discountValue,
      maxUses: body.maxUses ? parseInt(body.maxUses, 10) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      listingId: body.listingId || null,
      sellerId: session.user.id,
      isActive: true,
    },
    include: {
      listing: { select: { id: true, title: true, slug: true, category: true } },
    },
  });

  return NextResponse.json(coupon, { status: 201 });
}
