import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNewsletterCampaign, AudienceSegmentKey } from "@/lib/newsletter";

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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    campaignId,
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
    // If campaign doesn't have an ID yet, create one
    let targetCampaignId = campaignId;
    if (!targetCampaignId) {
      const created = await prisma.newsletterCampaign.create({
        data: {
          title: (title || subject).trim(),
          subject: subject.trim(),
          preheader: preheader?.trim() || null,
          heading: heading.trim(),
          bodyHtml,
          buttonLabel: buttonLabel?.trim() || null,
          buttonUrl: buttonUrl?.trim() || null,
          footerNote: footerNote?.trim() || null,
          targetAudience,
          customEmails,
          status: "SENDING",
          createdById: admin.user.id,
        },
      });
      targetCampaignId = created.id;
    }

    // Execute the batch dispatch
    const result = await dispatchNewsletterCampaign({
      campaignId: targetCampaignId,
      audience: targetAudience as AudienceSegmentKey,
      customEmails,
      subject: subject.trim(),
      preheader: preheader?.trim() || null,
      heading: heading.trim(),
      bodyHtml,
      buttonLabel: buttonLabel?.trim() || null,
      buttonUrl: buttonUrl?.trim() || null,
      footerNote: footerNote?.trim() || null,
      adminId: admin.user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Broadcast complete! Dispatched to ${result.sent} recipients (${result.failed} failures).`,
      result,
      campaignId: targetCampaignId,
    });
  } catch (err) {
    console.error("[Newsletter Dispatch] Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to dispatch newsletter broadcast";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
