import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks - List and filter discoverable networks
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const filter = searchParams.get("filter") || "all"; // all, mine, joined, following

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { tagline: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { owner: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (session?.user?.id) {
      const userId = session.user.id;
      if (filter === "mine") {
        where.ownerId = userId;
      } else if (filter === "joined") {
        where.members = {
          some: {
            userId,
            status: "ACTIVE",
          },
        };
      } else if (filter === "following") {
        where.followers = {
          some: {
            userId,
          },
        };
      }
    }

    const networks = await prisma.proNetwork.findMany({
      where,
      orderBy: [{ memberCount: "desc" }, { createdAt: "desc" }],
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            tier: true,
            headline: true,
            digitalCard: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            followers: true,
            discussions: true,
            resources: true,
            media: true,
            events: true,
          },
        },
      },
      take: 50,
    });

    // Check current user's membership and follow status for each network
    let userMemberships: Set<string> = new Set();
    let userFollows: Set<string> = new Set();

    if (session?.user?.id) {
      const [members, follows] = await Promise.all([
        prisma.proNetworkMember.findMany({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
          },
          select: { networkId: true },
        }),
        prisma.proNetworkFollower.findMany({
          where: { userId: session.user.id },
          select: { networkId: true },
        }),
      ]);

      userMemberships = new Set(members.map((m) => m.networkId));
      userFollows = new Set(follows.map((f) => f.networkId));
    }

    const formattedNetworks = networks.map((net) => ({
      ...net,
      isOwner: session?.user?.id === net.ownerId,
      isMember: userMemberships.has(net.id) || session?.user?.id === net.ownerId,
      isFollowing: userFollows.has(net.id),
    }));

    return NextResponse.json({ networks: formattedNetworks });
  } catch (error) {
    console.error("Failed to fetch Pro Networks:", error);
    return NextResponse.json({ error: "Failed to fetch networks" }, { status: 500 });
  }
}

// POST /api/pro-networks - Create a new Pro Network
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      tagline,
      description,
      category,
      coverImage,
      logoImage,
      monthlyPrice,
      rules,
      welcomeMessage,
      previewContent,
      memberBenefits,
      badgeShape,
      badgeInitials,
      badgeText,
      badgeIcon,
      badgeBgColor,
      badgeTextColor,
      badgeBorderColor,
      badgeCustomImage,
      allowDirectMessage,
      allowDirectText,
      directTextPhone,
      allowQuestions,
      allowConsultations,
      consultationUrl,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Network name is required" }, { status: 400 });
    }

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!baseSlug) {
      baseSlug = "network";
    }

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.proNetwork.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const price = typeof monthlyPrice === "number" ? monthlyPrice : parseFloat(monthlyPrice || "19.99") || 19.99;

    // Create the Pro Network and automatically add owner as first member
    const network = await prisma.proNetwork.create({
      data: {
        name: name.trim(),
        slug,
        tagline: tagline?.trim() || null,
        description: description?.trim() || "",
        category: category || "General",
        coverImage: coverImage || null,
        logoImage: logoImage || null,
        monthlyPrice: price,
        rules: rules?.trim() || null,
        welcomeMessage: welcomeMessage?.trim() || null,
        previewContent: previewContent?.trim() || null,
        memberBenefits: Array.isArray(memberBenefits) ? memberBenefits : [],
        badgeShape: badgeShape || "rounded",
        badgeInitials: badgeInitials?.trim() || null,
        badgeText: badgeText?.trim() || "MEMBER",
        badgeIcon: badgeIcon || "Star",
        badgeBgColor: badgeBgColor || "#0a1628",
        badgeTextColor: badgeTextColor || "#f0c040",
        badgeBorderColor: badgeBorderColor || "#d4a017",
        badgeCustomImage: badgeCustomImage || null,
        allowDirectMessage: allowDirectMessage ?? true,
        allowDirectText: allowDirectText ?? false,
        directTextPhone: directTextPhone?.trim() || null,
        allowQuestions: allowQuestions ?? true,
        allowConsultations: allowConsultations ?? true,
        consultationUrl: consultationUrl?.trim() || null,
        ownerId: session.user.id,
        memberCount: 1,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
        // Seed default initial announcement and discussion
        announcements: {
          create: {
            authorId: session.user.id,
            title: `Welcome to ${name.trim()}! 👋`,
            content:
              welcomeMessage ||
              "Introduce yourself in the discussion board and let us know what you'd like to learn more about.",
            isPinned: true,
          },
        },
        discussions: {
          create: {
            authorId: session.user.id,
            title: "Welcome & Introductions",
            content: "Welcome everyone! Introduce yourself, your background, and your practice goals.",
            category: "General",
            isPinned: true,
            isMembersOnly: true,
          },
        },
      },
    });

    return NextResponse.json({ network });
  } catch (error) {
    console.error("Failed to create Pro Network:", error);
    return NextResponse.json({ error: "Failed to create network" }, { status: 500 });
  }
}
