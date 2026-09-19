import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/specialists/admin";
import { prisma } from "@/lib/prisma";
import { TOOLKITS } from "@/lib/toolkits";
import { z } from "zod";
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req.headers)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [forums, networks, courses, assets] = await Promise.all([
    prisma.forum.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.proNetwork.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isPublished: true,
        memberCount: true,
        monthlyPrice: true,
        owner: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        price: true,
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.toolkitAsset.findMany(),
  ]);
  return NextResponse.json({
    forums,
    networks,
    courses,
    toolkits: TOOLKITS.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      price: t.price,
      description: t.description,
      asset: assets.find((a) => a.toolkitId === t.id) || null,
    })),
  });
}
const update = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("forum"),
    id: z.string(),
    name: z.string().min(1).max(150),
    description: z.string().max(5000),
    isPinned: z.boolean(),
    isAdminOnly: z.boolean(),
  }),
  z.object({
    kind: z.literal("network"),
    id: z.string(),
    name: z.string().min(1).max(150),
    description: z.string().max(5000),
    isPublished: z.boolean(),
  }),
  z.object({
    kind: z.literal("toolkit"),
    id: z.string(),
    fileUrl: z.url().refine((s) => s.startsWith("https://")),
    fileName: z.string().min(1).max(250),
  }),
]);
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req.headers)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = update.safeParse(await req.json().catch(() => null));
  if (!result.success)
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  const { kind, id, ...data } = result.data;
  if (kind === "forum" && "isPinned" in data)
    await prisma.forum.update({ where: { id }, data });
  if (kind === "network" && "isPublished" in data)
    await prisma.proNetwork.update({ where: { id }, data });
  if (kind === "toolkit" && "fileUrl" in data) {
    if (!TOOLKITS.some((t) => t.id === id))
      return NextResponse.json({ error: "Unknown toolkit" }, { status: 404 });
    await prisma.toolkitAsset.upsert({
      where: { toolkitId: id },
      update: data,
      create: { toolkitId: id, ...data },
    });
  }
  return NextResponse.json({ ok: true });
}
