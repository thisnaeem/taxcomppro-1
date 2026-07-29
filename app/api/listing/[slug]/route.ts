import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: req.headers });

  // Try slug first, fall back to ID for backward compat
  const listing = await prisma.marketplaceListing.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      status: "APPROVED",
    },
    include: {
      user: { select: { id: true, name: true, image: true, headline: true, role: true, tier: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let hasPurchased = false;
  if (session) {
    if (session.user.id === listing.userId || session.user.role === "ADMIN") {
      hasPurchased = true;
    } else {
      const purchase = await prisma.marketplacePurchase.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
      });
      if (purchase) hasPurchased = true;
    }
  }

  // Increment view count (fire-and-forget)
  prisma.marketplaceListing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({ ...listing, hasPurchased });
}

