import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const coupon = await prisma.marketplaceCoupon.findUnique({ where: { id } });
  if (!coupon || (coupon.sellerId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  await prisma.marketplaceCoupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const coupon = await prisma.marketplaceCoupon.findUnique({ where: { id } });
  if (!coupon || (coupon.sellerId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const updated = await prisma.marketplaceCoupon.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.maxUses !== undefined ? { maxUses: body.maxUses ? parseInt(body.maxUses, 10) : null } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } : {}),
    },
  });

  return NextResponse.json(updated);
}
