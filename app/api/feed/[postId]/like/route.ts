import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await params;

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.postLike.create({ data: { userId: session.user.id, postId } });
    await prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
    return NextResponse.json({ liked: true });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  try {
    const likes = await prisma.postLike.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
            role: true,
            tier: true,
          },
        },
      },
    });

    const userIds = likes.map((l) => l.user.id);
    const [completedEnrollments, toolkitPurchases] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: { in: userIds }, completedAt: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.toolkitPurchase.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const badgeUserIds = new Set([
      ...completedEnrollments.map((e) => e.userId),
      ...toolkitPurchases.map((t) => t.userId),
    ]);

    const formattedLikes = likes.map((l) => ({
      id: l.id,
      createdAt: l.createdAt,
      user: {
        ...l.user,
        hasDueDiligenceBadge: badgeUserIds.has(l.user.id),
      },
    }));

    return NextResponse.json({
      likes: formattedLikes,
      totalCount: formattedLikes.length,
    });
  } catch (error) {
    console.error("Error fetching post likes:", error);
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
  }
}
