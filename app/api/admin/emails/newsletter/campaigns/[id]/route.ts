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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Query recent email logs linked to this campaign
    const logs = await prisma.emailLog.findMany({
      where: {
        templateKey: "NEWSLETTER_CAMPAIGN",
        metadata: {
          path: ["campaignId"],
          equals: id,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        recipient: true,
        subject: true,
        status: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ campaign, logs });
  } catch (err) {
    console.error("[Campaign GET ID] Error:", err);
    return NextResponse.json({ error: "Failed to retrieve campaign" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    await prisma.newsletterCampaign.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Campaign DELETE] Error:", err);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
