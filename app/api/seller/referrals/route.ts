import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const referrals = await prisma.marketplaceReferral.findMany({
    where: { sellerId: session.user.id },
    include: {
      listing: { select: { id: true, title: true, slug: true, category: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(referrals);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawCode = (body.code || "").toUpperCase().trim().replace(/[^A-Z0-9_-]/g, "");
  const code = rawCode || `AFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const existing = await prisma.marketplaceReferral.findUnique({
    where: { code },
  });

  if (existing) {
    return NextResponse.json({ error: "This referral/affiliate code is already taken. Please pick another." }, { status: 409 });
  }

  const commissionRate = Number(body.commissionRate) || 10;

  const referral = await prisma.marketplaceReferral.create({
    data: {
      code,
      commissionRate,
      listingId: body.listingId || null,
      sellerId: session.user.id,
    },
    include: {
      listing: { select: { id: true, title: true, slug: true, category: true } },
    },
  });

  return NextResponse.json(referral, { status: 201 });
}
