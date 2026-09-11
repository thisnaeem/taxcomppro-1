import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderDynamicEmail, DEFAULT_EMAIL_TEMPLATES } from "@/lib/email-defaults";
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
    templateKey,
    subject: customSubject,
    preheader: customPreheader,
    heading: customHeading,
    bodyHtml: customBodyHtml,
    buttonLabel: customButtonLabel,
    buttonUrl: customButtonUrl,
    footerNote: customFooterNote,
    variables: customVariables,
  } = body;

  if (!to || !String(to).includes("@")) {
    return NextResponse.json({ error: "A valid recipient email address is required." }, { status: 400 });
  }

  try {
    let subject = customSubject;
    let html = "";

    // If templateKey is provided and no custom content, or if custom draft fields provided:
    let templateData = {
      subject: customSubject || "Test Email from Tax Compliance Pro Admin",
      preheader: customPreheader || "This is a live test preview sent from the admin panel.",
      heading: customHeading || "Test Notification",
      bodyHtml: customBodyHtml || "<p>This is a test notification generated from your Admin Panel.</p>",
      buttonLabel: customButtonLabel || "",
      buttonUrl: customButtonUrl || "",
      footerNote: customFooterNote || "Sent from Tax Compliance Pro Admin Console.",
    };

    const def = DEFAULT_EMAIL_TEMPLATES.find((d) => d.key === templateKey);
    const vars = {
      ...(def?.sampleVariables || {}),
      ...(customVariables || {}),
      email: to,
    };

    // If template fields are empty, load from DB
    if (templateKey && (!customSubject || !customHeading || !customBodyHtml)) {
      const dbTemplate = await prisma.emailTemplate.findUnique({
        where: { key: templateKey },
      });
      if (dbTemplate) {
        templateData = {
          subject: dbTemplate.subject,
          preheader: dbTemplate.preheader || "",
          heading: dbTemplate.heading,
          bodyHtml: dbTemplate.bodyHtml,
          buttonLabel: dbTemplate.buttonLabel || "",
          buttonUrl: dbTemplate.buttonUrl || "",
          footerNote: dbTemplate.footerNote || "",
        };
      }
    }

    const compiled = renderDynamicEmail({
      template: templateData,
      variables: vars,
    });

    subject = `[TEST] ${compiled.subject}`;
    html = compiled.html;

    await sendEmail({
      to: to.trim(),
      subject,
      html,
      templateKey: templateKey || "ADMIN_TEST_SEND",
      metadata: {
        isTest: true,
        sentByAdminId: admin.user.id,
        templateKey: templateKey || null,
        variablesUsed: vars,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${to.trim()}`,
      subject,
    });
  } catch (err) {
    console.error("[Send Test Email] Failed:", err);
    const message = err instanceof Error ? err.message : "Failed to send test email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
