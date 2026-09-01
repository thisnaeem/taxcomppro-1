import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/discussions/[discussionId]/replies
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; discussionId: string }> }
) {
  try {
    const { slug, discussionId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    const replies = await prisma.proNetworkDiscussionReply.findMany({
      where: { discussionId },
      orderBy: { createdAt: "asc" },
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

    return NextResponse.json({ replies });
  } catch (error) {
    console.error("Failed to fetch replies:", error);
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/discussions/[discussionId]/replies
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; discussionId: string }> }
) {
  try {
    const { slug, discussionId } = await params;
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
        return NextResponse.json({ error: "Must be an active member to reply" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const reply = await prisma.proNetworkDiscussionReply.create({
      data: {
        discussionId,
        authorId: session.user.id,
        content: content.trim(),
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

    // Increment reply count on discussion
    await prisma.proNetworkDiscussion.update({
      where: { id: discussionId },
      data: { replyCount: { increment: 1 } },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 });
  }
}
