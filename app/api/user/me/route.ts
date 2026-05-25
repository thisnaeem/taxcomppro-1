import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Always returns fresh user data from DB (not from session cache)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, completedCourse, toolkitPurchase] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, tier: true, image: true, coverImage: true, bio: true, headline: true, voiceMemoUrl: true },
    }),
    prisma.enrollment.count({
      where: { userId: session.user.id, completedAt: { not: null } },
    }),
    prisma.toolkitPurchase.count({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasDueDiligenceBadge = completedCourse > 0 || toolkitPurchase > 0;
  return NextResponse.json({ ...user, hasDueDiligenceBadge });
}
