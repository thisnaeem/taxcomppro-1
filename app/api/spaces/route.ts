import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

const HOST_SELECT = {
  id: true,
  name: true,
  image: true,
  headline: true,
  role: true,
  tier: true,
};

// GET /api/spaces — list live, upcoming, following, popular, and replay spaces
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const tab = searchParams.get("tab"); // "live" | "upcoming" | "following" | "popular" | "replays" | "all"

    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    const userId = session?.user?.id;

    // Collect invite cookies: pro-talk-invite-[spaceId]
    const inviteCookies = req.cookies.getAll()
      .filter(c => c.name.startsWith("pro-talk-invite-"))
      .map(c => ({
        id: c.name.replace("pro-talk-invite-", ""),
        token: c.value,
      }))
      .filter(c => !!c.id && !!c.token);

    // Build visibility OR conditions
    const visibilityOrConditions: Prisma.SpaceWhereInput[] = [
      { visibility: "PUBLIC" },
    ];

    if (userId) {
      if (session?.user?.role === "ADMIN") {
        visibilityOrConditions.push({ visibility: "PRIVATE" });
      } else {
        visibilityOrConditions.push(
          { hostId: userId },
          { coHostIds: { has: userId } },
          { rsvps: { some: { userId } } },
          { attendances: { some: { userId } } }
        );
      }
    }

    for (const ic of inviteCookies) {
      visibilityOrConditions.push({
        id: ic.id,
        shareToken: ic.token,
      });
    }

    const andConditions: Prisma.SpaceWhereInput[] = [
      { OR: visibilityOrConditions },
    ];

    // Category filter
    if (category && category !== "all") {
      andConditions.push({ category: { equals: category, mode: "insensitive" } });
    }

    // Keyword search filter (matches title, description, or host name)
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
          { host: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    // Filter by tab type
    if (tab === "live") {
      andConditions.push({ isLive: true });
    } else if (tab === "upcoming") {
      andConditions.push({
        isLive: false,
        endedAt: null,
        scheduledAt: { gt: new Date() },
      });
    } else if (tab === "replays") {
      andConditions.push({
        OR: [
          { isReplay: true },
          { replayUrl: { not: null } },
          { endedAt: { not: null } },
        ],
      });
    } else if (tab === "following") {
      if (userId) {
        // Find hosts the user is connected to
        const connections = await prisma.connection.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ requesterId: userId }, { receiverId: userId }],
          },
          select: { requesterId: true, receiverId: true },
        });

        const followedHostIds = connections.map(c =>
          c.requesterId === userId ? c.receiverId : c.requesterId
        );

        andConditions.push({
          hostId: { in: followedHostIds },
          OR: [
            { isLive: true },
            { isLive: false, endedAt: null, scheduledAt: { gt: new Date() } },
          ],
        });
      } else {
        // Not logged in -> return empty for following tab
        return NextResponse.json([]);
      }
    } else if (!tab || tab === "all" || tab === "popular") {
      // Default: Live + Upcoming sessions (or Replays if explicitly requested)
      andConditions.push({
        OR: [
          { isLive: true },
          { isLive: false, endedAt: null, scheduledAt: { gt: new Date() } },
        ],
      });
    }

    const whereConditions: Prisma.SpaceWhereInput = {
      AND: andConditions,
    };

    // Determine order
    let orderBy: Prisma.SpaceOrderByWithRelationInput[] = [
      { isLive: "desc" },
      { scheduledAt: "asc" },
      { createdAt: "desc" },
    ];

    if (tab === "popular") {
      orderBy = [
        { totalAttendees: "desc" },
        { rsvps: { _count: "desc" } },
        { isLive: "desc" },
      ];
    }

    const spaces = await prisma.space.findMany({
      where: whereConditions,
      orderBy,
      include: {
        host: { select: HOST_SELECT },
        _count: { select: { rsvps: true, attendances: true } },
      },
    });

    let registeredIds = new Set<string>();
    let joinedIds = new Set<string>();

    if (userId) {
      const [registrations, attendances] = await Promise.all([
        prisma.spaceRsvp.findMany({
          where: { userId, spaceId: { in: spaces.map(space => space.id) } },
          select: { spaceId: true },
        }),
        prisma.spaceAttendance.findMany({
          where: { userId, spaceId: { in: spaces.map(space => space.id) } },
          select: { spaceId: true },
        }),
      ]);
      registeredIds = new Set(registrations.map(item => item.spaceId));
      joinedIds = new Set(attendances.map(item => item.spaceId));
    }

    return NextResponse.json(
      spaces.map(space => ({
        ...space,
        isRsvped: registeredIds.has(space.id),
        hasJoined: joinedIds.has(space.id),
      }))
    );
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return NextResponse.json({ error: "Failed to fetch Pro Talks" }, { status: 500 });
  }
}

// POST /api/spaces — create a new space (Marketplace Plus or Admin or paid pass)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, tier: true },
  });
  const canHost = dbUser?.role === "ADMIN" || dbUser?.tier === "MARKETPLACE_PLUS";

  const body = await req.json();
  const {
    name,
    description,
    category,
    mediaType,
    hostSessionId,
    scheduledAt,
    coHostIds,
    visibility = "PUBLIC",
  } = body;

  let hostVerified = canHost;
  if (!hostVerified && hostSessionId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const stripeSession = await stripe.checkout.sessions.retrieve(hostSessionId);
      if (
        stripeSession.payment_status === "paid" &&
        stripeSession.metadata?.userId === session.user.id &&
        stripeSession.metadata?.type === "pro_talk_host"
      ) {
        hostVerified = true;
      }
    } catch {
      /* ignore */
    }
  }

  if (!hostVerified) {
    return NextResponse.json(
      { error: "Only Marketplace Plus members or Admin can host a Pro Talk." },
      { status: 403 }
    );
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!["PUBLIC", "PRIVATE"].includes(visibility)) return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });

  // Parse scheduledAt if provided
  let scheduledDate: Date | null = null;
  if (scheduledAt) {
    const parsed = new Date(scheduledAt);
    if (!isNaN(parsed.getTime()) && parsed > new Date()) {
      scheduledDate = parsed;
    }
  }

  const roomName = `space-${nanoid(10)}`;
  const shareToken = nanoid(32);

  const space = await prisma.space.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      category: category?.trim() || "Open Discussion",
      mediaType: mediaType === "AUDIO" ? "AUDIO" : "AUDIO_VIDEO",
      hostId: session.user.id,
      coHostIds: Array.isArray(coHostIds) ? coHostIds : [],
      roomName,
      shareToken,
      visibility,
      // If scheduled for later, mark not live yet
      isLive: scheduledDate ? false : true,
      scheduledAt: scheduledDate,
    },
    include: {
      host: { select: HOST_SELECT },
      _count: { select: { rsvps: true, attendances: true } },
    },
  });

  return NextResponse.json(space, { status: 201 });
}
