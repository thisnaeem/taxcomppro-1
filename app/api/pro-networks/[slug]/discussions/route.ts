import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/discussions - Get discussions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const session = await auth.api.getSession({ headers: req.headers });

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    // Check membership
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

    const where: Record<string, unknown> = {
      networkId: network.id,
    };

    if (category && category !== "All") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const discussions = await prisma.proNetworkDiscussion.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            headline: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      take: 50,
    });

    // If not a member, mask full content of members-only discussions
    const sanitized = discussions.map((d) => {
      if (d.isMembersOnly && !isMember) {
        return {
          ...d,
          content: d.content.slice(0, 80) + "...",
          isLocked: true,
        };
      }
      return {
        ...d,
        isLocked: false,
      };
    });

    return NextResponse.json({ discussions: sanitized, isMember });
  } catch (error) {
    console.error("Failed to fetch discussions:", error);
    return NextResponse.json({ error: "Failed to fetch discussions" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/discussions - Create a discussion thread
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

    // Verify member status
    const isOwner = session.user.id === network.ownerId;
    if (!isOwner) {
      const member = await prisma.proNetworkMember.findUnique({
        where: {
          networkId_userId: {
            networkId: network.id,
            userId: session.user.id,
          },
        },
      });
      if (!member || member.status !== "ACTIVE") {
        return NextResponse.json({ error: "Must be an active member to post" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { title, content, category, isPinned, isMembersOnly } = body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const discussion = await prisma.proNetworkDiscussion.create({
      data: {
        networkId: network.id,
        authorId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        category: category || "General",
        isPinned: isOwner ? (isPinned ?? false) : false,
        isMembersOnly: isMembersOnly ?? true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            headline: true,
          },
        },
      },
    });

    return NextResponse.json({ discussion });
  } catch (error) {
    console.error("Failed to create discussion:", error);
    return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 });
  }
}
