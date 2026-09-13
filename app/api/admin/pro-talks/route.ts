import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/pro-talks — retrieve reports and attendance summaries for moderation
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [reports, recentSpaces] = await Promise.all([
      prisma.spaceReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          reporter: { select: { id: true, name: true, email: true, image: true } },
          space: { select: { id: true, name: true, category: true, roomName: true, hostId: true } },
        },
      }),
      prisma.space.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          host: { select: { id: true, name: true, email: true } },
          _count: { select: { rsvps: true, reports: true, attendances: true } },
        },
      }),
    ]);

    return NextResponse.json({ reports, recentSpaces });
  } catch (error) {
    console.error("Error fetching admin pro-talks:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/admin/pro-talks — update report status
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reportId, status } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.spaceReport.update({
      where: { id: reportId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
