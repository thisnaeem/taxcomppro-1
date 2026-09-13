import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/spaces/[id]/report — report inappropriate behavior or content
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Sign in to report" }, { status: 401 });
    }

    const body = await req.json();
    const { reason, reportedUserId, details } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Please select a reason" }, { status: 400 });
    }

    const report = await prisma.spaceReport.create({
      data: {
        spaceId: id,
        reporterId: session.user.id,
        reportedUserId: reportedUserId || null,
        reason: reason.trim(),
        details: details?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Thank you. Your report has been submitted to TaxCompliancePro moderation.",
    }, { status: 201 });
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
