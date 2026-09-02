import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [pro, ownedNetworks, discussionsStarted, proTalksHosted] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: { in: ["PROFESSIONAL", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        image: true,
        coverImage: true,
        headline: true,
        bio: true,
        mission: true,
        location: true,
        yearsExperience: true,
        website: true,
        linkedIn: true,
        twitter: true,
        facebook: true,
        specialties: true,
        certifications: true,
        languages: true,
        mediaPhotos: true,
        voiceMemoUrl: true,
        createdAt: true,
        instructorCourses: {
          where: { status: "PUBLISHED" },
          select: { id: true, slug: true, title: true, thumbnail: true, level: true, price: true, isFree: true },
          take: 4,
        },
      },
    }),
    prisma.proNetwork.findMany({
      where: { ownerId: id },
      select: {
        id: true,
        name: true,
        slug: true,
        memberCount: true,
        followerCount: true,
        _count: {
          select: {
            members: { where: { status: "ACTIVE" } },
            followers: true,
            discussions: true,
            events: true,
          },
        },
      },
    }),
    prisma.proNetworkDiscussion.count({
      where: { authorId: id },
    }),
    prisma.proNetworkEvent.count({
      where: { hostId: id },
    }),
  ]);

  if (!pro) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const proNetworksOwned = ownedNetworks.length;
  const proNetworkMembers = ownedNetworks.reduce(
    (sum, net) => sum + Math.max(net._count.members, net.memberCount || 0),
    0
  );
  const followers = ownedNetworks.reduce(
    (sum, net) => sum + Math.max(net._count.followers, net.followerCount || 0),
    0
  );
  const primaryNetwork = ownedNetworks[0] || null;

  return NextResponse.json({
    ...pro,
    networkStats: {
      followers,
      proNetworkMembers,
      proNetworksOwned,
      discussionsStarted,
      proTalksHosted,
      primaryNetworkSlug: primaryNetwork?.slug ?? null,
      primaryNetworkName: primaryNetwork?.name ?? null,
    },
  });
}
