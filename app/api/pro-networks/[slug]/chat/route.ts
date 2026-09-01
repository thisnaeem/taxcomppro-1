import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/chat - Get channel chat messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "general";
    const session = await auth.api.getSession({ headers: req.headers });

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    // Verify membership
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

    if (!isMember) {
      return NextResponse.json({ error: "Private Network Chat is for active members only" }, { status: 403 });
    }

    const messages = await prisma.proNetworkChatMessage.findMany({
      where: {
        networkId: network.id,
        channel,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        sender: {
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

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/chat - Send chat message
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
        return NextResponse.json({ error: "Only active members can chat" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { channel, content, attachments } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const message = await prisma.proNetworkChatMessage.create({
      data: {
        networkId: network.id,
        channel: channel || "general",
        senderId: session.user.id,
        content: content.trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
      },
      include: {
        sender: {
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

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Failed to post chat message:", error);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
