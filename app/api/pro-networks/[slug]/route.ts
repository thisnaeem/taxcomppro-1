import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug] - Get full network details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            tier: true,
            headline: true,
            bio: true,
            location: true,
            specialties: true,
            certifications: true,
            digitalCard: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: { where: { status: "ACTIVE" } },
            followers: true,
            discussions: true,
            media: true,
            resources: true,
            events: true,
          },
        },
      },
    });

    if (!network) {
      return NextResponse.json({ error: "Pro Network not found" }, { status: 404 });
    }

    let isOwner = false;
    let isMember = false;
    let membershipRole: string | null = null;
    let isFollowing = false;

    if (session?.user?.id) {
      isOwner = session.user.id === network.ownerId;

      const [member, follower] = await Promise.all([
        prisma.proNetworkMember.findUnique({
          where: {
            networkId_userId: {
              networkId: network.id,
              userId: session.user.id,
            },
          },
        }),
        prisma.proNetworkFollower.findUnique({
          where: {
            networkId_userId: {
              networkId: network.id,
              userId: session.user.id,
            },
          },
        }),
      ]);

      if (isOwner) {
        isMember = true;
        membershipRole = "OWNER";
      } else if (member && member.status === "ACTIVE") {
        isMember = true;
        membershipRole = member.role;
      }

      isFollowing = !!follower;
    }

    return NextResponse.json({
      network: {
        ...network,
        isOwner,
        isMember,
        membershipRole,
        isFollowing,
      },
    });
  } catch (error) {
    console.error("Failed to fetch Pro Network:", error);
    return NextResponse.json({ error: "Failed to fetch network" }, { status: 500 });
  }
}

// PATCH /api/pro-networks/[slug] - Update network details (Owner/Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const network = await prisma.proNetwork.findUnique({ where: { slug } });
    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    if (network.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      tagline,
      description,
      category,
      coverImage,
      logoImage,
      monthlyPrice,
      rules,
      welcomeMessage,
      previewContent,
      memberBenefits,
      badgeShape,
      badgeInitials,
      badgeText,
      badgeIcon,
      badgeBgColor,
      badgeTextColor,
      badgeBorderColor,
      badgeCustomImage,
      allowDirectMessage,
      allowDirectText,
      directTextPhone,
      allowQuestions,
      allowConsultations,
      consultationUrl,
      notifyAnnouncements,
      notifyResources,
      notifyLiveEvents,
      notifyNewTraining,
      notifyNewPosts,
      notifyDiscussions,
      notifyEvents,
    } = body;

    const updated = await prisma.proNetwork.update({
      where: { slug },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(tagline !== undefined && { tagline: tagline?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || "" }),
        ...(category !== undefined && { category }),
        ...(coverImage !== undefined && { coverImage }),
        ...(logoImage !== undefined && { logoImage }),
        ...(monthlyPrice !== undefined && { monthlyPrice: Number(monthlyPrice) }),
        ...(rules !== undefined && { rules }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(previewContent !== undefined && { previewContent }),
        ...(memberBenefits !== undefined && { memberBenefits }),
        ...(badgeShape !== undefined && { badgeShape }),
        ...(badgeInitials !== undefined && { badgeInitials }),
        ...(badgeText !== undefined && { badgeText }),
        ...(badgeIcon !== undefined && { badgeIcon }),
        ...(badgeBgColor !== undefined && { badgeBgColor }),
        ...(badgeTextColor !== undefined && { badgeTextColor }),
        ...(badgeBorderColor !== undefined && { badgeBorderColor }),
        ...(badgeCustomImage !== undefined && { badgeCustomImage }),
        ...(allowDirectMessage !== undefined && { allowDirectMessage }),
        ...(allowDirectText !== undefined && { allowDirectText }),
        ...(directTextPhone !== undefined && { directTextPhone }),
        ...(allowQuestions !== undefined && { allowQuestions }),
        ...(allowConsultations !== undefined && { allowConsultations }),
        ...(consultationUrl !== undefined && { consultationUrl }),
        ...(notifyAnnouncements !== undefined && { notifyAnnouncements }),
        ...(notifyResources !== undefined && { notifyResources }),
        ...(notifyLiveEvents !== undefined && { notifyLiveEvents }),
        ...(notifyNewTraining !== undefined && { notifyNewTraining }),
        ...(notifyNewPosts !== undefined && { notifyNewPosts }),
        ...(notifyDiscussions !== undefined && { notifyDiscussions }),
        ...(notifyEvents !== undefined && { notifyEvents }),
      },
    });

    return NextResponse.json({ network: updated });
  } catch (error) {
    console.error("Failed to update Pro Network:", error);
    return NextResponse.json({ error: "Failed to update network" }, { status: 500 });
  }
}

// DELETE /api/pro-networks/[slug] - Delete network
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const network = await prisma.proNetwork.findUnique({ where: { slug } });
    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    if (network.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.proNetwork.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete network:", error);
    return NextResponse.json({ error: "Failed to delete network" }, { status: 500 });
  }
}
