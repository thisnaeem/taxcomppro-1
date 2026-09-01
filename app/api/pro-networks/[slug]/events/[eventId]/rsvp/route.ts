import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/pro-networks/[slug]/events/[eventId]/rsvp - Toggle RSVP
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) {
  try {
    const { slug, eventId } = await params;
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

    // Check membership
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
        return NextResponse.json({ error: "Must be a member to register for events" }, { status: 403 });
      }
    }

    const existing = await prisma.proNetworkEventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      await prisma.proNetworkEventRsvp.delete({
        where: {
          eventId_userId: {
            eventId,
            userId: session.user.id,
          },
        },
      });
      return NextResponse.json({ registered: false });
    } else {
      await prisma.proNetworkEventRsvp.create({
        data: {
          eventId,
          userId: session.user.id,
          status: "REGISTERED",
        },
      });
      return NextResponse.json({ registered: true });
    }
  } catch (error) {
    console.error("Failed to toggle RSVP:", error);
    return NextResponse.json({ error: "Failed to toggle RSVP" }, { status: 500 });
  }
}
