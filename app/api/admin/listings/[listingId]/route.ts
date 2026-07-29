import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const caller = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (caller?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { listingId } = await params;

  try {
    await prisma.marketplaceListing.delete({
      where: { id: listingId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
