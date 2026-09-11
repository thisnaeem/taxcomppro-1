import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return { session, user };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "ALL"; // ALL, SENT, FAILED
  const templateKey = searchParams.get("templateKey") || "ALL";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "30", 10)));
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (search) {
    whereClause.OR = [
      { recipient: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "SENT" || status === "FAILED") {
    whereClause.status = status;
  }

  if (templateKey && templateKey !== "ALL") {
    whereClause.templateKey = templateKey;
  }

  // Count metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalCount, filteredCount, sentTodayCount, failedCount, logs] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: whereClause }),
    prisma.emailLog.count({
      where: { createdAt: { gte: startOfToday }, status: "SENT" },
    }),
    prisma.emailLog.count({
      where: { status: "FAILED" },
    }),
    prisma.emailLog.findMany({
      where: whereClause,
      select: {
        id: true,
        recipient: true,
        subject: true,
        templateKey: true,
        status: true,
        errorMessage: true,
        metadata: true,
        createdAt: true,
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const successRate =
    totalCount > 0 ? Math.round(((totalCount - failedCount) / totalCount) * 100) : 100;

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      totalCount: filteredCount,
      totalPages: Math.ceil(filteredCount / limit),
    },
    stats: {
      totalSent: totalCount,
      sentToday: sentTodayCount,
      failedCount,
      successRate,
    },
  });
}
