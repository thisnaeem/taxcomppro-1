import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return u?.role === "ADMIN" ? session : null;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const communities = await prisma.community.findMany({
    include: {
      creator: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(communities);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const result = await prisma.community.deleteMany({});
    return NextResponse.json({ success: true, message: `Deleted ${result.count} communities`, count: result.count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete communities";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
