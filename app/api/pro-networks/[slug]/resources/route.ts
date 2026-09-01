import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/resources - Get resource vault
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const resources = await prisma.proNetworkResource.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const sanitized = resources.map((r) => {
      if (r.isMembersOnly && !isMember) {
        return {
          ...r,
          fileUrl: "", // Mask download link for non-members
          isLocked: true,
        };
      }
      return {
        ...r,
        isLocked: false,
      };
    });

    return NextResponse.json({ resources: sanitized, isMember });
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/resources - Add new resource
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
      return NextResponse.json({ error: "Only network owners can add resources" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, fileType, fileUrl, fileSize, isMembersOnly } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 });
    }

    const resource = await prisma.proNetworkResource.create({
      data: {
        networkId: network.id,
        uploaderId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        fileType: fileType || "PDF",
        fileUrl: fileUrl.trim(),
        fileSize: fileSize?.trim() || null,
        isMembersOnly: isMembersOnly ?? true,
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Failed to add resource:", error);
    return NextResponse.json({ error: "Failed to add resource" }, { status: 500 });
  }
}
