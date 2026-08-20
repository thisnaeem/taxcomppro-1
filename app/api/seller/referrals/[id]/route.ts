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

  const ref = await prisma.marketplaceReferral.findUnique({ where: { id } });
  if (!ref || (ref.sellerId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 });
  }

  await prisma.marketplaceReferral.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
