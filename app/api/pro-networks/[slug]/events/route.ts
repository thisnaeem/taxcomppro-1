import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/events - Get upcoming Pro Talks & events
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    let isMember = false;
    if (session?.user?.id) {
      if (session.user.id === network.ownerId) {
        isMember = true;
      } else {
        const member = await prisma.proNetworkMember.findUnique({
          where: {
            networkId_userId: {
              networkId: network.id,
              userId: session.user.id,
            },
          },
        });
        isMember = member?.status === "ACTIVE";
      }
    }

    const [events, ownerSpaces] = await Promise.all([
      prisma.proNetworkEvent.findMany({
        where: { networkId: network.id },
        orderBy: { scheduledAt: "asc" },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              headline: true,
            },
          },
          rsvps: {
            select: {
              userId: true,
              status: true,
            },
          },
        },
      }),
      prisma.space.findMany({
        where: {
          hostId: network.ownerId,
          endedAt: null,
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              headline: true,
            },
          },
          rsvps: {
            select: {
              userId: true,
            },
          },
        },
      }),
    ]);

    const userRsvps = new Set(
      session?.user?.id
        ? events.flatMap((e) => e.rsvps.filter((r) => r.userId === session.user.id).map(() => e.id))
        : []
    );

    const userSpaceRsvps = new Set(
      session?.user?.id
        ? ownerSpaces.flatMap((s) => s.rsvps.filter((r) => r.userId === session.user.id).map(() => s.id))
        : []
    );

    const formattedEvents = events.map((ev) => ({
      ...ev,
      isRegistered: userRsvps.has(ev.id),
      rsvpCount: ev.rsvps.length,
      isLocked: ev.isMembersOnly && !isMember,
      liveUrl: ev.isMembersOnly && !isMember ? null : ev.liveUrl,
    }));

    const formattedSpaces = ownerSpaces.map((sp) => ({
      id: sp.id,
      title: sp.name,
      description: sp.description,
      eventType: "PRO_TALK",
      scheduledAt: sp.scheduledAt || sp.createdAt,
      durationMinutes: 60,
      isLive: sp.isLive,
      liveUrl: `/pro-talks/${sp.id}`,
      roomName: sp.roomName,
      isMembersOnly: true,
      createdAt: sp.createdAt,
      host: sp.host,
      isRegistered: userSpaceRsvps.has(sp.id),
      rsvpCount: sp.rsvps.length,
      isLocked: !isMember,
      isProTalkSpace: true,
    }));

    const allEvents = [...formattedSpaces, ...formattedEvents];

    return NextResponse.json({ events: allEvents, isMember });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/events - Schedule a Pro Talk or live event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    const isOwner = session.user.id === network.ownerId || session.user.role === "ADMIN";
    if (!isOwner) {
      return NextResponse.json({ error: "Only network owners can create events" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      eventType,
      scheduledAt,
      durationMinutes,
      isLive,
      liveUrl,
      roomName,
      isMembersOnly,
    } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Title and scheduled date are required" }, { status: 400 });
    }

    const event = await prisma.proNetworkEvent.create({
      data: {
        networkId: network.id,
        hostId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        eventType: eventType || "PRO_TALK",
        scheduledAt: new Date(scheduledAt),
        durationMinutes: Number(durationMinutes || 60),
        isLive: isLive ?? false,
        liveUrl: liveUrl?.trim() || null,
        roomName: roomName?.trim() || null,
        isMembersOnly: isMembersOnly ?? true,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
