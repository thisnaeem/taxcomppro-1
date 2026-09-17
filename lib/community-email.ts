import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { DEFAULT_EMAIL_TEMPLATES, compileTemplateString, renderDynamicEmail } from "@/lib/email-defaults";
import { BRAND, escapeHtml } from "@/lib/email-template";

type CommunityNotification = {
  kind: "CONNECTION_REQUEST" | "DIRECT_MESSAGE";
  recipientId: string;
  senderId: string;
  eventId: string;
};

/** Uses the configured support sender and existing delivery logs. Never throws into the user action. */
export async function sendCommunityNotificationEmail({ kind, recipientId, senderId, eventId }: CommunityNotification) {
  try {
    if (recipientId === senderId) return;
    const [recipient, sender] = await Promise.all([
      prisma.user.findUnique({ where: { id: recipientId }, select: { name: true, email: true } }),
      prisma.user.findUnique({ where: { id: senderId }, select: { name: true } }),
    ]);
    if (!recipient?.email || !sender) return;
    const definition = DEFAULT_EMAIL_TEMPLATES.find(t => t.key === kind)!;
    const { sampleVariables: _samples, ...defaults } = definition;
    const template = await prisma.emailTemplate.upsert({
      where: { key: kind },
      update: {},
      create: { ...defaults, isActive: true },
    });
    if (!template.isActive) return;
    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || BRAND.site).replace(/\/$/, "");
    const actionUrl = kind === "CONNECTION_REQUEST" ? `${siteUrl}/connections` : `${siteUrl}/messages?user=${encodeURIComponent(senderId)}`;
    const variables = { recipientName: recipient.name || "there", senderName: sender.name || "A community member", actionUrl, siteUrl };
    // Body HTML needs escaped user values; the shell separately escapes heading, subject preview and links.
    const safeVariables = Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escapeHtml(value)]));
    const rendered = renderDynamicEmail({ template: { ...template, bodyHtml: compileTemplateString(template.bodyHtml, safeVariables) }, variables });
    await sendEmail({
      to: recipient.email,
      subject: rendered.subject.replace(/[\r\n]+/g, " "),
      html: rendered.html,
      text: `Hi ${variables.recipientName},\n\n${variables.senderName} ${kind === "CONNECTION_REQUEST" ? "would like to connect with you" : "sent you a private message"}.\n\n${actionUrl}\n\nTax Compliance Pro`,
      templateKey: kind,
      metadata: { eventId, senderId, recipientId },
    });
  } catch (error) {
    console.error(`[Community email] ${kind} delivery failed for event ${eventId}:`, error instanceof Error ? error.message : "Unknown error");
  }
}
