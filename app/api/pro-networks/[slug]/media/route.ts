import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/media - Get media gallery
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // PHOTO, VIDEO, FILE, ALL
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

    const where: Record<string, unknown> = {
      networkId: network.id,
    };

    if (type && type !== "ALL" && type !== "all") {
      where.type = type.toUpperCase();
    }

    const media = await prisma.proNetworkMedia.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const sanitized = media.map((m) => {
      if (m.isMembersOnly && !isMember) {
        return {
          ...m,
          url: "", // Mask media content for non-members
          isLocked: true,
        };
      }
      return {
        ...m,
        isLocked: false,
      };
    });

    return NextResponse.json({ media: sanitized, isMember });
  } catch (error) {
    console.error("Failed to fetch media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/media - Add media
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

    // Owner or admin only for adding official media
    const isOwner = session.user.id === network.ownerId || session.user.role === "ADMIN";
    if (!isOwner) {
      return NextResponse.json({ error: "Only network owners can add media" }, { status: 403 });
    }

    const body = await req.json();
    const { title, type, url, thumbnailUrl, duration, isMembersOnly } = body;

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
    }

    const item = await prisma.proNetworkMedia.create({
      data: {
        networkId: network.id,
        uploaderId: session.user.id,
        title: title.trim(),
        type: type || "PHOTO",
        url: url.trim(),
        thumbnailUrl: thumbnailUrl?.trim() || null,
        duration: duration?.trim() || null,
        isMembersOnly: isMembersOnly ?? true,
      },
    });

    return NextResponse.json({ media: item });
  } catch (error) {
    console.error("Failed to add media:", error);
    return NextResponse.json({ error: "Failed to add media" }, { status: 500 });
  }
}
