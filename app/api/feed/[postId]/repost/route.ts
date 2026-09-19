import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRepost } from "@/lib/feed-social";
import { detectSensitiveData, PRIVACY_REMINDER } from "@/lib/specialists/catalog";
type Context = { params: Promise<{ postId: string }> };

export async function POST(req: Request, { params }: Context) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Sign in to repost." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || body.content.length > 3000)
    return NextResponse.json({ error: "Your comment must be 3,000 characters or less." }, { status: 400 });
  if (detectSensitiveData(body.content)) return NextResponse.json({ error: PRIVACY_REMINDER }, { status: 400 });
  const { postId } = await params;
  try {
    const result = await prisma.$transaction(async tx => {
      const source = await tx.post.findUnique({ where: { id: postId }, include: { community: { select: { isPublic: true } } } });
      if (!source || source.scheduledAt) return null;
      const original = source.isRepost && source.originalPostId
        ? await tx.post.findUnique({ where: { id: source.originalPostId }, include: { community: { select: { isPublic: true } } } }) : source;
      if (!canRepost(original) || !original) return null;
      // One repost per member/original, including concurrent repeated requests.
      return tx.post.upsert({
        where: { authorId_originalPostId: { authorId: session.user.id, originalPostId: original.id } },
        update: {},
        create: { authorId: session.user.id, originalPostId: original.id, isRepost: true, content: body.content.trim(), images: [] },
        select: { id: true },
      });
    });
    if (!result) return NextResponse.json({ error: "This post is unavailable or belongs to a private group and cannot be reposted." }, { status: 403 });
    return NextResponse.json({ id: result.id, url: `/feed?post=${result.id}` });
  } catch {
    return NextResponse.json({ error: "Couldn’t repost. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Sign in to remove your repost." }, { status: 401 });
  const { postId } = await params;
  // postId is the original post; only remove this member's wrapper, never the original.
  await prisma.post.deleteMany({ where: { authorId: session.user.id, originalPostId: postId, isRepost: true } });
  return NextResponse.json({ ok: true });
}
