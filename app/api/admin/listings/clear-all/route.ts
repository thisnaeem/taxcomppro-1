import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return u?.role === "ADMIN" ? session : null;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const result = await prisma.marketplaceListing.deleteMany({});
    return NextResponse.json({ success: true, message: `Deleted ${result.count} marketplace listings`, count: result.count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete listings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
