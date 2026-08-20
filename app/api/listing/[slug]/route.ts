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
    },
    include: {
      user: { select: { id: true, name: true, image: true, headline: true, role: true, tier: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow APPROVED listings, or allow owner / ADMIN to preview pending
  if (listing.status !== "APPROVED") {
    if (!session || (session.user.id !== listing.userId && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

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

  // If this listing is a Course, fetch full course curriculum & enrollment info
  let courseData = null;
  const meta = listing.metadata as Record<string, unknown> | null;
  const courseId = meta?.courseId as string | undefined;
  const courseSlug = (meta?.courseSlug as string | undefined) || listing.slug || undefined;

  if (listing.category === "TRAINING" || meta?.isCourse || courseId || courseSlug) {
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          ...(courseId ? [{ id: courseId }] : []),
          ...(courseSlug ? [{ slug: courseSlug }] : []),
          ...(listing.slug ? [{ slug: listing.slug }] : []),
        ],
      },
      include: {
        instructor: { select: { id: true, name: true, image: true, headline: true, role: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                order: true,
                isFree: true,
                contentType: true,
                downloadUrl: true,
                downloadName: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (course) {
      let isEnrolled = false;
      if (session?.user) {
        if (session.user.id === course.instructorId || session.user.role === "ADMIN") {
          isEnrolled = true;
        } else {
          const enr = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
          });
          if (enr) isEnrolled = true;
        }
      }

      const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

      courseData = {
        ...course,
        totalLessons,
        isEnrolled,
      };
    }
  }

  // Increment view count (fire-and-forget)
  prisma.marketplaceListing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({ ...listing, hasPurchased, course: courseData });
}

