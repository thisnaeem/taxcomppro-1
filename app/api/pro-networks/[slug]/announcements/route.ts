import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/announcements
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    const announcements = await prisma.proNetworkAnnouncement.findMany({
      where: { networkId: network.id },
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
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/announcements
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
      return NextResponse.json({ error: "Only network owners can post announcements" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, isPinned } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const announcement = await prisma.proNetworkAnnouncement.create({
      data: {
        networkId: network.id,
        authorId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        isPinned: isPinned ?? false,
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

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Failed to post announcement:", error);
    return NextResponse.json({ error: "Failed to post announcement" }, { status: 500 });
  }
}
