import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [user, acceptedConnectionsCount, hasTraining, hasToolkit] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, image: true, coverImage: true,
        headline: true, bio: true, mission: true, location: true,
        yearsExperience: true, website: true, linkedIn: true,
        twitter: true, facebook: true, specialties: true,
        certifications: true, languages: true, mediaPhotos: true,
        voiceMemoUrl: true,
        role: true, tier: true, createdAt: true,
        instructorCourses: {
          where: { status: "PUBLISHED" },
          select: { id: true, slug: true, title: true, thumbnail: true, level: true, price: true, isFree: true },
          take: 6,
        },
        listings: {
          where: { status: "APPROVED" },
          select: { id: true, slug: true, title: true, description: true, price: true, category: true, images: true },
          take: 6,
        },
        proServices: {
          select: { id: true, title: true, description: true, price: true, emoji: true },
          take: 6,
        },
        reviewsReceived: {
          select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,
            reviewer: { select: { id: true, name: true, image: true, headline: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        posts: {
          where: { communityId: null, scheduledAt: null },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            content: true,
            images: true,
            videoUrl: true,
            likeCount: true,
            commentCount: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            posts: true,
            instructorCourses: true,
            listings: true,
            reviewsReceived: true,
          },
        },
      },
    }),
    prisma.connection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: id }, { receiverId: id }],
      },
    }),
    prisma.enrollment.findFirst({
      where: { userId: id, completedAt: { not: null } },
      select: { id: true },
    }),
    prisma.toolkitPurchase.findFirst({
      where: { userId: id },
      select: { id: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...user,
    connectionCount: acceptedConnectionsCount,
    hasDueDiligenceBadge: Boolean(hasTraining || hasToolkit),
  });
}
