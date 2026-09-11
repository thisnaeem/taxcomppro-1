import {
  BRAND,
  escapeHtml,
  renderButton,
  renderEmailShell,
} from "@/lib/email-template";
import type { PrismaClient } from "@prisma/client";

export interface DefaultEmailTemplateDef {
  key: string;
  name: string;
  category: "AUTH" | "SUPPORT" | "BILLING" | "SYSTEM";
  description: string;
  subject: string;
  preheader: string;
  heading: string;
  bodyHtml: string;
  buttonLabel?: string;
  buttonUrl?: string;
  footerNote?: string;
  variables: string[];
  sampleVariables: Record<string, string>;
}

export const DEFAULT_EMAIL_TEMPLATES: DefaultEmailTemplateDef[] = [
  {
    key: "OTP_VERIFICATION",
    name: "Registration PIN & Verification Code",
    category: "AUTH",
    description:
      "Sent to new users when verifying their email during sign up or login authentication.",
    subject: "{{code}} is your Tax Compliance Pro verification code",
    preheader: "Your verification code is {{code}}. It expires in {{expiresInMinutes}} minutes.",
    heading: "Confirm your email address",
    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">Hi {{userName}},</p>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">Enter this code to confirm <strong style="color:#0f172a;">{{email}}</strong> and finish creating your account.</p>
<div style="background-color:#f8fafc;border:1px dashed #d4a017;border-radius:12px;padding:22px;margin:24px 0;text-align:center;">
  <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#0a1628;display:inline-block;">{{code}}</span>
</div>
<div style="background-color:#f8fafc;border-left:4px solid #d4a017;border-radius:8px;padding:14px 18px;margin:20px 0;">
  <p style="font-size:13px;line-height:1.6;color:#475569;margin:0;">
    <strong style="color:#0f172a;">This code expires in {{expiresInMinutes}} minutes.</strong>
    If you did not try to create an account, you can ignore this email and no account will be made.
    Never share this code with anyone, including anyone claiming to be from Tax Compliance Pro.
  </p>
</div>`,
    buttonLabel: "",
    buttonUrl: "",
    footerNote: "This code was requested during sign up on taxcomppro.com.",
    variables: ["code", "userName", "email", "expiresInMinutes", "siteUrl"],
    sampleVariables: {
      code: "849201",
      userName: "Sarah",
      email: "sarah@example.com",
      expiresInMinutes: "10",
      siteUrl: "https://taxcomppro.com",
    },
  },
  {
    key: "PASSWORD_RESET",
    name: "Password Reset Link",
    category: "AUTH",
    description: "Sent when a user requests to reset their Tax Compliance Pro password.",
    subject: "Reset your Tax Compliance Pro password",
    preheader: "Reset your password. This link is valid for 60 minutes.",
    heading: "Reset your password",
    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">Hello {{userName}},</p>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">We received a request to reset the password for the account linked to <strong style="color:#0f172a;">{{email}}</strong>.</p>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">Choose a new password using the button below. This link is valid for 60 minutes and can only be used once.</p>
<div style="background-color:#f8fafc;border-left:4px solid #d4a017;border-radius:8px;padding:14px 18px;margin:20px 0;">
  <p style="font-size:13px;line-height:1.6;color:#475569;margin:0;">
    <strong style="color:#0f172a;">Security notice:</strong> If you did not request a password reset, you can safely ignore this email. Your account remains secure and your password is unchanged.
  </p>
</div>`,
    buttonLabel: "Reset password",
    buttonUrl: "{{resetUrl}}",
    footerNote: "If the button above does not work, copy and paste the reset link into your browser.",
    variables: ["userName", "email", "resetUrl", "siteUrl"],
    sampleVariables: {
      userName: "Michael",
      email: "michael@example.com",
      resetUrl: "https://taxcomppro.com/reset-password?token=sample-reset-token-xyz",
      siteUrl: "https://taxcomppro.com",
    },
  },
  {
    key: "SUPPORT_TICKET_CREATED",
    name: "Support Ticket Confirmation (Member)",
    category: "SUPPORT",
    description: "Sent to members immediately upon opening a new support ticket.",
    subject: "[Ticket #{{ticketShortId}}] We received your request: {{subject}}",
    preheader: "Ticket #{{ticketShortId}} is open. We usually reply within 24 business hours.",
    heading: "We received your request",
    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">Hello {{userName}},</p>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">Thanks for reaching out. Your request is logged and our support team has been notified.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:0 0 20px 0;">
  <div style="font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Ticket Details</div>
  <p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;"><strong>Ticket ID:</strong> #{{ticketShortId}}</p>
  <p style="margin:0 0 12px 0;font-size:14px;color:#0f172a;"><strong>Subject:</strong> {{subject}}</p>
  <div style="font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">Your message:</div>
  <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;color:#475569;white-space:pre-wrap;">{{description}}</div>
</div>
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">Our team usually responds within 24 business hours. You can also track this ticket anytime from your account dashboard.</p>`,
    buttonLabel: "Open your dashboard",
    buttonUrl: "{{dashboardUrl}}",
    footerNote: "This ticket was submitted from taxcomppro.com.",
    variables: [
      "userName",
      "email",
      "ticketId",
      "ticketShortId",
      "subject",
      "description",
      "dashboardUrl",
      "siteUrl",
    ],
    sampleVariables: {
      userName: "Alex Johnson",
      email: "alex@example.com",
      ticketId: "cm7812903741892",
      ticketShortId: "41892",
      subject: "Questions about Marketplace Seller Verification",
      description: "Hi support team, I submitted my credentials yesterday. How long does the verification typically take?",
      dashboardUrl: "https://taxcomppro.com/feed",
      siteUrl: "https://taxcomppro.com",
    },
  },
  {
    key: "SUPPORT_TICKET_ADMIN_ALERT",
    name: "Support Ticket Alert (Admin / Staff)",
    category: "SUPPORT",
    description: "Internal alert sent to support team when a user opens a new ticket.",
    subject: "[New ticket #{{ticketShortId}}] {{subject}} (from {{userName}})",
    preheader: "{{userName}} opened ticket #{{ticketShortId}}: {{subject}}",
    heading: "New support ticket #{{ticketShortId}}",
    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">A new support ticket <strong style="color:#0f172a;">#{{ticketShortId}}</strong> was opened by <strong style="color:#0f172a;">{{userName}}</strong> (<a href="mailto:{{email}}" style="color:#d4a017;text-decoration:none;">{{email}}</a>).</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:0 0 20px 0;">
  <p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;"><strong>Subject:</strong> {{subject}}</p>
  <p style="margin:0 0 12px 0;font-size:14px;color:#0f172a;"><strong>User ID:</strong> {{ticketId}}</p>
  <div style="font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">Inquiry message:</div>
  <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;color:#475569;white-space:pre-wrap;">{{description}}</div>
</div>`,
    buttonLabel: "Open in admin",
    buttonUrl: "{{adminUrl}}",
    footerNote: "Internal notification sent to Tax Compliance Pro administrators.",
    variables: [
      "userName",
      "email",
      "ticketId",
      "ticketShortId",
      "subject",
      "description",
      "adminUrl",
      "siteUrl",
    ],
    sampleVariables: {
      userName: "Alex Johnson",
      email: "alex@example.com",
      ticketId: "cm7812903741892",
      ticketShortId: "41892",
      subject: "Questions about Marketplace Seller Verification",
      description: "Hi support team, I submitted my credentials yesterday. How long does the verification typically take?",
      adminUrl: "https://taxcomppro.com/admin/support",
      siteUrl: "https://taxcomppro.com",
    },
  },
  {
    key: "SUPPORT_TICKET_UPDATED",
    name: "Support Ticket Status Update (Member)",
    category: "SUPPORT",
    description: "Sent to the ticket creator when staff updates the ticket status or provides feedback.",
    subject: "[Ticket #{{ticketShortId}}] Update on your request: {{subject}}",
    preheader: "Ticket #{{ticketShortId}} status update: {{statusLabel}}.",
    heading: "Update on your support request",
    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">Hello {{userName}},</p>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">There is an update on your support request <strong style="color:#0f172a;">#{{ticketShortId}}</strong>.</p>
<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:0 0 20px 0;">
  <p style="margin:0 0 8px 0;font-size:14px;color:#0f172a;"><strong>Status:</strong> <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;background-color:#e0f2fe;color:#0369a1;">{{statusLabel}}</span></p>
  <p style="margin:0 0 12px 0;font-size:14px;color:#0f172a;"><strong>Subject:</strong> {{subject}}</p>
  <div style="font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;">Response from Support Team:</div>
  <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;color:#475569;white-space:pre-wrap;">{{feedback}}</div>
</div>
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">You can review your full conversation history or reply from your Concierge support panel.</p>`,
    buttonLabel: "View your ticket",
    buttonUrl: "{{dashboardUrl}}",
    footerNote: "You received this email because you created a support ticket on taxcomppro.com.",
    variables: [
      "userName",
      "email",
      "ticketId",
      "ticketShortId",
      "subject",
      "status",
      "statusLabel",
      "feedback",
      "dashboardUrl",
      "siteUrl",
    ],
    sampleVariables: {
      userName: "Alex Johnson",
      email: "alex@example.com",
      ticketId: "cm7812903741892",
      ticketShortId: "41892",
      subject: "Questions about Marketplace Seller Verification",
      status: "RESOLVED",
      statusLabel: "Resolved",
      feedback: "Your documents have been verified and your professional seller account is now fully approved! You can now publish listings.",
      dashboardUrl: "https://taxcomppro.com/feed",
      siteUrl: "https://taxcomppro.com",
    },
  },
  {
    key: "MEMBERSHIP_UPGRADED",
    name: "Membership Upgrade Confirmation",
    category: "BILLING",
    description: "Sent to members when their membership plan is upgraded or renewed.",
    subject: "Your {{tierName}} is active",
    preheader: "Your {{tierName}} is active. Here is what you can now do.",
    heading: "Welcome to {{tierName}}",
    bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">Congratulations, <strong style="color:#0f172a;">{{userName}}</strong>.</p>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">Your upgrade is live! Your account now has full access to all features and exclusive benefits included in the <strong style="color:#0f172a;">{{tierName}}</strong> plan.</p>
<div style="background-color:#0a1628;background-image:linear-gradient(135deg,#0a1628 0%,#16305c 100%);border-radius:14px;padding:24px;margin:0 0 24px 0;color:#ffffff;">
  <div style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#f0c040;margin-bottom:6px;">Active Plan</div>
  <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:10px;">{{tierName}}</div>
  <div style="font-size:13px;color:#a9b8d0;line-height:1.5;">
    Status: <strong style="color:#4ade80;">Active</strong><br />
    Renews on: <strong style="color:#ffffff;">{{periodEndFormatted}}</strong>
  </div>
</div>
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">Head over to your dashboard to begin exploring your enhanced tools, private networking, and client acquisition features.</p>`,
    buttonLabel: "Go to your dashboard",
    buttonUrl: "{{dashboardUrl}}",
    footerNote: "This email was sent to {{email}} about your Tax Compliance Pro membership.",
    variables: [
      "userName",
      "email",
      "tier",
      "tierName",
      "periodEndFormatted",
      "isComplimentary",
      "dashboardUrl",
      "siteUrl",
    ],
    sampleVariables: {
      userName: "David Miller",
      email: "david@example.com",
      tier: "VIP",
      tierName: "VIP Membership",
      periodEndFormatted: "October 11, 2026",
      isComplimentary: "false",
      dashboardUrl: "https://taxcomppro.com/feed",
      siteUrl: "https://taxcomppro.com",
    },
  },
];

/**
 * Replaces all {{variable}} placeholders in a string with matching values from a variables map.
 */
export function compileTemplateString(
  template: string,
  variables: Record<string, unknown>
): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = variables[key];
    if (val === undefined || val === null) return "";
    return String(val);
  });
}

/**
 * Compiles an email template into complete email HTML and subject line using provided variables.
 */
export function renderDynamicEmail({
  template,
  variables,
}: {
  template: {
    subject: string;
    preheader?: string | null;
    heading: string;
    bodyHtml: string;
    buttonLabel?: string | null;
    buttonUrl?: string | null;
    footerNote?: string | null;
  };
  variables: Record<string, unknown>;
}): { subject: string; html: string } {
  // Merge default site variables
  const mergedVars: Record<string, unknown> = {
    siteUrl: BRAND.site,
    supportEmail: BRAND.supportEmail,
    ...variables,
  };

  const subject = compileTemplateString(template.subject, mergedVars);
  const preheader = compileTemplateString(template.preheader || "", mergedVars);
  const heading = compileTemplateString(template.heading, mergedVars);
  const bodyContent = compileTemplateString(template.bodyHtml, mergedVars);
  const buttonLabel = compileTemplateString(template.buttonLabel || "", mergedVars);
  const buttonUrl = compileTemplateString(template.buttonUrl || "", mergedVars);
  const footerNote = compileTemplateString(template.footerNote || "", mergedVars);

  const buttonHtml =
    buttonLabel && buttonUrl ? renderButton({ href: buttonUrl, label: buttonLabel }) : "";

  const finalBody = [bodyContent, buttonHtml].filter(Boolean).join("\n");

  const html = renderEmailShell({
    preheader: preheader || subject,
    heading,
    body: finalBody,
    footerNote: footerNote || undefined,
  });

  return { subject, html };
}

/**
 * Ensures all standard default templates exist in the database.
 * If any template is missing, it is created with default content.
 */
export async function seedDefaultEmailTemplates(prisma: PrismaClient) {
  for (const def of DEFAULT_EMAIL_TEMPLATES) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: def.key },
    });

    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
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
    }
  }
}
