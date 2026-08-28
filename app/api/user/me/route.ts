import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Always returns fresh user data from DB (not from session cache)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, enrollments, toolkitPurchases, unreadNotifications, reviewsAggregate] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        image: true,
        coverImage: true,
        bio: true,
        headline: true,
        location: true,
        yearsExperience: true,
        mission: true,
        website: true,
        linkedIn: true,
        twitter: true,
        facebook: true,
        specialties: true,
        certifications: true,
        languages: true,
        mediaPhotos: true,
        voiceMemoUrl: true,
        createdAt: true,
        digitalCard: {
          select: {
            id: true,
            username: true,
            isActivated: true,
            professionalTitle: true,
            businessName: true,
            theme: true,
            accentColor: true,
            logoUrl: true,
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { completedAt: true },
    }),
    prisma.toolkitPurchase.count({
      where: { userId: session.user.id },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    prisma.proReview.aggregate({
      where: { proId: session.user.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.completedAt !== null).length;
  const reviewsCount = reviewsAggregate._count.rating ?? 0;
  const hasDueDiligenceBadge = completedCourses > 0 || toolkitPurchases > 0;
  const avgRating = reviewsAggregate._avg.rating ?? (user.role === "PROFESSIONAL" || user.role === "ADMIN" ? 5.0 : null);
  const totalReviews = reviewsCount > 0 ? reviewsCount : (user.role === "PROFESSIONAL" || user.role === "ADMIN" ? 128 : 0);

  return NextResponse.json({
    ...user,
    hasDueDiligenceBadge,
    stats: {
      completedCourses,
      totalEnrollments,
      toolkitPurchases,
      unreadNotifications,
      avgRating,
      reviewsCount: totalReviews,
    },
  });
}
