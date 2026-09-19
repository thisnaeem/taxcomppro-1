import {hasNetworkMembership} from "@/lib/networkAccess";
import {replyInSpace} from "@/lib/specialists/service";
import {detectSensitiveData,PRIVACY_REMINDER} from "@/lib/specialists/catalog";
import { NextRequest, NextResponse, after } from "next/server";
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

    const discussion=await prisma.proNetworkDiscussion.findFirst({where:{id:discussionId,networkId:network.id}});
    if(!discussion)return NextResponse.json({error:"Discussion not found"},{status:404});
    if(discussion.isMembersOnly && session?.user.id!==network.ownerId && session?.user.role!=="ADMIN") {
      const membership=session?await prisma.proNetworkMember.findUnique({where:{networkId_userId:{networkId:network.id,userId:session.user.id}}}):null;
      if(!hasNetworkMembership(membership))return NextResponse.json({error:"Members only"},{status:403});
    }
    const replies = await prisma.proNetworkDiscussionReply.findMany({
      where: { discussionId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileSlug: true,
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

    if(!await prisma.proNetworkDiscussion.findFirst({where:{id:discussionId,networkId:network.id}})) return NextResponse.json({error:"Discussion not found"},{status:404});
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
      if (!hasNetworkMembership(member)) {
        return NextResponse.json({ error: "Must be an active member to reply" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

  if(detectSensitiveData(content))return NextResponse.json({error:PRIVACY_REMINDER},{status:400});
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
            profileSlug: true,
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

    after(() => replyInSpace("NETWORK",network.id,discussionId,session.user.id,content,reply.id).catch(() => console.error("AI reply failed; see specialist activity log.")));
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Failed to create reply:", error);
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 });
  }
}
