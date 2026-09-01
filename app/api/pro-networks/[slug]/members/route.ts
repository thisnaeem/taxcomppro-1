import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/members - Member directory
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
      select: { id: true, ownerId: true, memberCount: true },
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
      status: "ACTIVE",
    };

    if (!isMember) {
      where.showInDirectory = true;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { headline: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const members = await prisma.proNetworkMember.findMany({
      where,
      orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
      take: 60,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            tier: true,
            headline: true,
            location: true,
            digitalCard: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    const totalCount = await prisma.proNetworkMember.count({
      where: { networkId: network.id, status: "ACTIVE" },
    });

    return NextResponse.json({ members, totalCount, isMember });
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
