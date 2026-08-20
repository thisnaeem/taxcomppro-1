import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminSession = await requireAdmin(req);
  if (!adminSession) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      digitalCard: true,
      affiliateProfile: {
        include: {
          referrals: {
            include: {
              referredUser: {
                select: { id: true, name: true, email: true, image: true, createdAt: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 25,
          },
          payouts: {
            orderBy: { createdAt: "desc" },
            take: 25,
          },
        },
      },
      referredBy: {
        include: {
          affiliate: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      toolkitPurchases: {
        orderBy: { createdAt: "desc" },
      },
      marketplacePurchases: {
        include: {
          listing: { select: { id: true, title: true, price: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      featuredListings: {
        include: {
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      proAds: {
        orderBy: { createdAt: "desc" },
      },
      enrollments: {
        include: {
          course: { select: { id: true, title: true, slug: true, level: true } },
          progress: true,
        },
        orderBy: { createdAt: "desc" },
      },
      sessions: {
        orderBy: { expiresAt: "desc" },
        take: 5,
        select: { id: true, expiresAt: true, ipAddress: true, userAgent: true, createdAt: true },
      },
      _count: {
        select: {
          posts: true,
          comments: true,
          communityMembers: true,
          listings: true,
          proServices: true,
          reviewsGiven: true,
          reviewsReceived: true,
          enrollments: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const adminSession = await requireAdmin(req);
  if (!adminSession) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // Prevent admin from deleting their own account
  if (adminSession.user.id === userId) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account." },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, deletedUserId: userId });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user and associated records." },
      { status: 500 }
    );
  }
}
