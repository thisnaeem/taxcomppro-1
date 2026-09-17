import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const group = await prisma.community.findUnique({ where: { slug: (await params).slug } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!group.isPublic && group.creatorId !== session.user.id) {
    const [membership, user] = await Promise.all([prisma.communityMember.findUnique({ where: { userId_communityId: { userId: session.user.id, communityId: group.id } } }), prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })]);
    if (!membership && user?.role !== "ADMIN") return NextResponse.json({ error: "Join this group to see its members." }, { status: 403 });
  }
  const url = new URL(req.url), search = url.searchParams.get("search")?.slice(0,200), cursor = url.searchParams.get("cursor");
  const members = await prisma.communityMember.findMany({ where: { communityId: group.id, ...(search ? { user: { name: { contains: search, mode: "insensitive" } } } : {}) }, select: { id: true, role: true, user: { select: { id: true, name: true, image: true } } }, orderBy: [{ joinedAt: "asc" }, { id: "asc" }], take: 25, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
  return NextResponse.json({ members: members.slice(0,24), nextCursor: members.length > 24 ? members[23].id : null });
}
