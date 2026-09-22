import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return { session, user };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const unsubscribes = await prisma.newsletterUnsubscribe.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ unsubscribes });
  } catch (err) {
    console.error("[Unsubscribes GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch unsubscribes" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    await prisma.newsletterUnsubscribe.deleteMany({
      where: { email },
    });
    return NextResponse.json({ success: true, message: `Re-subscribed ${email}` });
  } catch (err) {
    console.error("[Unsubscribes DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to remove unsubscribe entry" }, { status: 500 });
  }
}
