import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/spaces/[id]/attendance — record join event and deduplicate attendance
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    const userId = session?.user?.id;

    const space = await prisma.space.findUnique({ where: { id } });
    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    if (userId) {
      // Upsert attendance record for logged in user to strictly prevent duplicate counting
      await prisma.spaceAttendance.upsert({
        where: {
          spaceId_userId: {
            spaceId: id,
            userId: userId,
          },
        },
        update: {
          leftAt: null, // Rejoining clears leftAt
        },
        create: {
          spaceId: id,
          userId: userId,
        },
      });
    }

    // Get total unique attendees
    const uniqueCount = await prisma.spaceAttendance.count({
      where: { spaceId: id },
    });

    const currentTotal = Math.max(uniqueCount, space.totalAttendees);
    const updated = await prisma.space.update({
      where: { id },
      data: {
        totalAttendees: currentTotal,
        peakAttendees: Math.max(space.peakAttendees, currentTotal),
      },
      select: {
        totalAttendees: true,
        peakAttendees: true,
      },
    });

    return NextResponse.json({
      success: true,
      totalAttendees: updated.totalAttendees,
      peakAttendees: updated.peakAttendees,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ error: "Attendance logging error" }, { status: 500 });
  }
}

// GET /api/spaces/[id]/attendance — retrieve post-session or live attendance stats
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);

    const space = await prisma.space.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        hostId: true,
        totalAttendees: true,
        peakAttendees: true,
        createdAt: true,
        endedAt: true,
      },
    });

    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

    const isHost = session?.user?.id === space.hostId || session?.user?.role === "ADMIN";

    // If host/admin, get attendee list
    let attendees: unknown[] = [];
    if (isHost) {
      attendees = await prisma.spaceAttendance.findMany({
        where: { spaceId: id },
        include: {
          user: {
            select: { id: true, name: true, image: true, email: true, role: true, tier: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      });
    }

    return NextResponse.json({
      spaceId: space.id,
      name: space.name,
      totalAttendees: space.totalAttendees,
      peakAttendees: space.peakAttendees,
      createdAt: space.createdAt,
      endedAt: space.endedAt,
      attendees: isHost ? attendees : undefined,
    });
  } catch (error) {
    console.error("Error retrieving attendance:", error);
    return NextResponse.json({ error: "Failed to retrieve attendance" }, { status: 500 });
  }
}
