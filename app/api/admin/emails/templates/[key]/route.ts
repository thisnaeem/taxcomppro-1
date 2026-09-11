import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/email-defaults";

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
  { params }: { params: Promise<{ key: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const template = await prisma.emailTemplate.findUnique({
    where: { key },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const def = DEFAULT_EMAIL_TEMPLATES.find((d) => d.key === key);

  return NextResponse.json({
    template: {
      ...template,
      sampleVariables: def?.sampleVariables || {},
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    subject,
    preheader,
    heading,
    bodyHtml,
    buttonLabel,
    buttonUrl,
    footerNote,
    isActive,
  } = body;

  if (!subject || !heading || !bodyHtml) {
    return NextResponse.json(
      { error: "Subject, heading, and body HTML are required." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.emailTemplate.update({
      where: { key },
      data: {
        subject: subject.trim(),
        preheader: preheader ? preheader.trim() : null,
        heading: heading.trim(),
        bodyHtml: bodyHtml.trim(),
        buttonLabel: buttonLabel ? buttonLabel.trim() : null,
        buttonUrl: buttonUrl ? buttonUrl.trim() : null,
        footerNote: footerNote ? footerNote.trim() : null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json({ template: updated });
  } catch (err) {
    console.error("[Template Update] Error updating template:", err);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
