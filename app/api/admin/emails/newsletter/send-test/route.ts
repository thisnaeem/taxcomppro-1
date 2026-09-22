import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewsletterTest } from "@/lib/newsletter";

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
    to,
    subject,
    preheader,
    heading,
    bodyHtml,
    buttonLabel,
    buttonUrl,
    footerNote,
  } = body;

  if (!to || !to.includes("@")) {
    return NextResponse.json(
      { error: "A valid recipient email address is required for test preview." },
      { status: 400 }
    );
  }
  if (!subject?.trim()) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!heading?.trim()) {
    return NextResponse.json({ error: "Heading is required" }, { status: 400 });
  }
  if (!bodyHtml?.trim()) {
    return NextResponse.json({ error: "Body content is required" }, { status: 400 });
  }

  try {
    await sendNewsletterTest({
      to: to.trim(),
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
      message: `Test newsletter preview dispatched to ${to.trim()} via Microsoft Graph!`,
    });
  } catch (err) {
    console.error("[Newsletter Test Send] Failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to send test newsletter";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
