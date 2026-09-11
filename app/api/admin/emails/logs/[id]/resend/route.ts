import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const log = await prisma.emailLog.findUnique({
    where: { id },
  });

  if (!log) {
    return NextResponse.json({ error: "Email log not found" }, { status: 404 });
  }

  try {
    await sendEmail({
      to: log.recipient,
      subject: log.subject,
      html: log.html,
      templateKey: log.templateKey || "RESEND",
      metadata: {
        originalLogId: log.id,
        resentByAdminId: admin.user.id,
        originalSentAt: log.createdAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Email resent successfully to ${log.recipient}`,
    });
  } catch (err) {
    console.error("[Email Resend] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to resend email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
