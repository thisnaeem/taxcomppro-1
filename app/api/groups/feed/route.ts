import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const search = url.searchParams.get("search")?.slice(0, 200);
  const posts = await prisma.post.findMany({
    where: { community: { members: { some: { userId: session.user.id } } }, scheduledAt: null, ...(search ? { content: { contains: search, mode: "insensitive" } } : {}) },
    include: { author: { select: { name: true, image: true } }, community: { select: { name: true, slug: true } }, _count: { select: { likes: true, comments: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return NextResponse.json({ posts: posts.slice(0,20), nextCursor: posts.length > 20 ? posts[19].id : null });
}
