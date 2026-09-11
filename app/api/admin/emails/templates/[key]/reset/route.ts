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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const def = DEFAULT_EMAIL_TEMPLATES.find((d) => d.key === key);

  if (!def) {
    return NextResponse.json({ error: "No system default template found for key: " + key }, { status: 404 });
  }

  try {
    const resetTemplate = await prisma.emailTemplate.upsert({
      where: { key },
      update: {
        name: def.name,
        category: def.category,
        description: def.description,
        subject: def.subject,
        preheader: def.preheader,
        heading: def.heading,
        bodyHtml: def.bodyHtml,
        buttonLabel: def.buttonLabel || null,
        buttonUrl: def.buttonUrl || null,
        footerNote: def.footerNote || null,
        isActive: true,
        variables: def.variables,
      },
      create: {
        key: def.key,
        name: def.name,
        category: def.category,
        description: def.description,
        subject: def.subject,
        preheader: def.preheader,
        heading: def.heading,
        bodyHtml: def.bodyHtml,
        buttonLabel: def.buttonLabel || null,
        buttonUrl: def.buttonUrl || null,
        footerNote: def.footerNote || null,
        isActive: true,
        variables: def.variables,
      },
    });

    return NextResponse.json({ template: resetTemplate, message: "Template reset to system default" });
  } catch (err) {
    console.error("[Template Reset] Error:", err);
    return NextResponse.json({ error: "Failed to reset template" }, { status: 500 });
  }
}
