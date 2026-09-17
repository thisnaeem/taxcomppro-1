import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupCreateSchema } from "@/lib/group-create-schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const session = await auth.api.getSession({ headers: req.headers });

  const communities = await prisma.community.findMany({
    where: {
      AND: [
        { OR: [{ isPublic: true }, ...(session ? [{ creatorId: session.user.id }, { members: { some: { userId: session.user.id } } }] : [])] },
        ...(search ? [{ OR: [{ name: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] }] : []),
      ],
    },
    include: { creator: { select: { id: true, name: true, image: true } }, _count: { select: { members: true, posts: true } } },
    orderBy: { memberCount: "desc" },
  });

  // Batch-check membership for current user
  let memberIds = new Set<string>();
  if (session) {
    const memberships = await prisma.communityMember.findMany({
      where: { userId: session.user.id },
      select: { communityId: true },
    });
    memberIds = new Set(memberships.map(m => m.communityId));
  }

  return NextResponse.json(communities.map(c => ({ ...c, isMember: memberIds.has(c.id) })));
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (dbUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can create groups" }, { status: 403 });
  }

  const parsed = groupCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const body = parsed.data;

  // Auto-generate slug from name
  const baseSlug = (body.name as string)
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "group";
  let slug = baseSlug === "create" ? `group-${baseSlug}` : baseSlug;
  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const community = await prisma.community.create({
    data: {
      name:        body.name,
      slug,
      description: body.description,
      icon:        body.icon ?? null,
      coverImage:  body.coverImage ?? null,
      isPublic:    body.isPublic ?? true,
      creatorId:   session.user.id,
      members: { create: { userId: session.user.id, role: "ADMIN" } },
    },
  });

  return NextResponse.json(community, { status: 201 });
}
