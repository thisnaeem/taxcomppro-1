import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  const [count, follow] = await Promise.all([
    prisma.userFollow.count({ where: { followingId: id } }),
    session ? prisma.userFollow.findUnique({ where: { followerId_followingId: { followerId: session.user.id, followingId: id } } }) : null,
  ]);
  return NextResponse.json({ following: !!follow, followerCount: count }, { headers: { "Cache-Control": "private, no-store" } });
}

async function change(req: Request, { params }: Context, following: boolean) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Sign in to follow members." }, { status: 401 });
  const { id } = await params;
  if (id === session.user.id) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (following) await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId: session.user.id, followingId: id } },
    create: { followerId: session.user.id, followingId: id }, update: {},
  });
  else await prisma.userFollow.deleteMany({ where: { followerId: session.user.id, followingId: id } });
  return NextResponse.json({ following, followerCount: await prisma.userFollow.count({ where: { followingId: id } }) });
}
export async function POST(req: Request, context: Context) { return change(req, context, true); }
export async function DELETE(req: Request, context: Context) { return change(req, context, false); }
