import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/pro-networks/[slug]/follow - Toggle follow status
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
      select: { id: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    const existing = await prisma.proNetworkFollower.findUnique({
      where: {
        networkId_userId: {
          networkId: network.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      await prisma.proNetworkFollower.delete({
        where: {
          networkId_userId: {
            networkId: network.id,
            userId: session.user.id,
          },
        },
      });
      await prisma.proNetwork.update({
        where: { id: network.id },
        data: { followerCount: { decrement: 1 } },
      });
      return NextResponse.json({ following: false });
    } else {
      await prisma.proNetworkFollower.create({
        data: {
          networkId: network.id,
          userId: session.user.id,
        },
      });
      await prisma.proNetwork.update({
        where: { id: network.id },
        data: { followerCount: { increment: 1 } },
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Failed to toggle follow:", error);
    return NextResponse.json({ error: "Failed to follow network" }, { status: 500 });
  }
}
