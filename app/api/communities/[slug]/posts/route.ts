import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET posts for a community
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth.api.getSession({ headers: req.headers });
  const posts = await prisma.post.findMany({
    where: { communityId: community.id },
    include: {
      likes: { where: { userId: session?.user.id ?? "" }, select: { userId: true } },
      author:   { select: { id: true, name: true, image: true, headline: true } },
      _count:   { select: { comments: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(posts.map(({ likes, ...post }) => ({ ...post, isLiked: likes.length > 0 })));
}

// POST new post in community
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Must be a member
  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
  });
  if (!membership) return NextResponse.json({ error: "Join the community first" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const post = await prisma.post.create({
    data: { content, authorId: session.user.id, communityId: community.id },
    include: { author: { select: { id: true, name: true, image: true, headline: true } }, _count: { select: { comments: true, likes: true } } },
  });

  // Update comment count on community post count
  await prisma.community.update({ where: { id: community.id }, data: { memberCount: { increment: 0 } } }).catch(() => {});

  return NextResponse.json(post, { status: 201 });
}
