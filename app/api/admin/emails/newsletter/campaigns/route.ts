import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAudienceRecipients, AudienceSegmentKey } from "@/lib/newsletter";

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

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "ALL";

  const whereClause: Record<string, unknown> = {};

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status !== "ALL") {
    whereClause.status = status;
  }

  try {
    const campaigns = await prisma.newsletterCampaign.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const totalCampaigns = await prisma.newsletterCampaign.count();
    const sentCampaigns = await prisma.newsletterCampaign.count({
      where: { status: "SENT" },
    });

    // Compute aggregated delivery stats
    const totalSentMails = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
    const totalFailedMails = campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0);

    return NextResponse.json({
      campaigns,
      stats: {
        totalCampaigns,
        sentCampaigns,
        totalSentMails,
        totalFailedMails,
      },
    });
  } catch (err) {
    console.error("[Campaigns GET] Failed to fetch campaigns:", err);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    id,
    title,
    subject,
    preheader,
    heading,
    bodyHtml,
    buttonLabel,
    buttonUrl,
    footerNote,
    targetAudience = "ALL",
    customEmails = [],
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Campaign title is required" }, { status: 400 });
  }
  if (!subject?.trim()) {
    return NextResponse.json({ error: "Email subject line is required" }, { status: 400 });
  }
  if (!heading?.trim()) {
    return NextResponse.json({ error: "Email heading is required" }, { status: 400 });
  }
  if (!bodyHtml?.trim()) {
    return NextResponse.json({ error: "Email body content is required" }, { status: 400 });
  }

  try {
    // Calculate potential recipient count
    const { recipients } = await resolveAudienceRecipients(
      targetAudience as AudienceSegmentKey,
      customEmails
    );

    if (id) {
      // Update existing draft
      const updated = await prisma.newsletterCampaign.update({
        where: { id },
        data: {
          title: title.trim(),
          subject: subject.trim(),
          preheader: preheader?.trim() || null,
          heading: heading.trim(),
          bodyHtml,
          buttonLabel: buttonLabel?.trim() || null,
          buttonUrl: buttonUrl?.trim() || null,
          footerNote: footerNote?.trim() || null,
          targetAudience,
          customEmails,
          totalRecipients: recipients.length,
        },
      });
      return NextResponse.json({ success: true, campaign: updated });
    }

    // Create new campaign draft
    const campaign = await prisma.newsletterCampaign.create({
      data: {
        title: title.trim(),
        subject: subject.trim(),
        preheader: preheader?.trim() || null,
        heading: heading.trim(),
        bodyHtml,
        buttonLabel: buttonLabel?.trim() || null,
        buttonUrl: buttonUrl?.trim() || null,
        footerNote: footerNote?.trim() || null,
        targetAudience,
        customEmails,
        totalRecipients: recipients.length,
        status: "DRAFT",
        createdById: admin.user.id,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    console.error("[Campaigns POST] Failed to save campaign draft:", err);
    const msg = err instanceof Error ? err.message : "Failed to save campaign";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
