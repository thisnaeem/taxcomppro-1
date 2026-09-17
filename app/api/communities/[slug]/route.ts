import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: req.headers });

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count:  { select: { members: true, posts: true } },
      members: {
        take: 8, orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = session
    ? !!(await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
      }))
    : false;

  const manager = session ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }) : null;
  const canManage = !!session && (community.creatorId === session.user.id || manager?.role === "ADMIN");
  return NextResponse.json({ ...community, isMember, canManage });
}
import { groupCreateSchema } from "@/lib/group-create-schema";

const settingsSchema = groupCreateSchema.pick({ name: true, description: true, coverImage: true });

async function authorizeManagement(req: NextRequest, slug: string) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return { error: NextResponse.json({ error: "Sign in to manage this group." }, { status: 401 }) };
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return { error: NextResponse.json({ error: "Group not found." }, { status: 404 }) };
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (community.creatorId !== session.user.id && user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Only the group host or a platform admin can manage this group." }, { status: 403 }) };
  return { community };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const access = await authorizeManagement(req, (await params).slug);
  if (access.error) return access.error;
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const community = await prisma.community.update({ where: { id: access.community.id }, data: parsed.data });
  return NextResponse.json(community);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const access = await authorizeManagement(req, (await params).slug);
  if (access.error) return access.error;
  const body = await req.json().catch(() => null);
  if (body?.confirmation !== access.community.name) return NextResponse.json({ error: "Type the group name exactly to confirm deletion." }, { status: 400 });
  await prisma.community.delete({ where: { id: access.community.id } });
  return NextResponse.json({ success: true });
}
