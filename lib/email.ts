import {
  BRAND,
  escapeHtml,
  renderBadge,
  renderButton,
  renderEmailShell,
  renderOtpCode,
  renderPanel,
  renderRow,
  renderText,
  FONT_STACK,
} from "@/lib/email-template";
import { prisma } from "@/lib/prisma";
import { renderDynamicEmail } from "@/lib/email-defaults";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  templateKey?: string;
  metadata?: Record<string, unknown>;
}

export interface PasswordResetEmailOptions {
  to: string;
  resetUrl: string;
  userName?: string;
}

// In-memory token cache for Microsoft Graph API
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Fetches an OAuth 2.0 access token from Microsoft Identity Platform
 * using the Client Credentials grant flow with in-memory caching.
 */
export async function getMicrosoftGraphAccessToken(): Promise<string> {
  const now = Date.now();
  // Return cached token if valid for at least 2 more minutes
  if (cachedAccessToken && tokenExpiresAt > now + 120 * 1000) {
    return cachedAccessToken;
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Microsoft Graph credentials in environment variables (MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET)"
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("[Microsoft Graph] Token request failed:", data);
    throw new Error(
      `Failed to obtain Microsoft Graph access token: ${data.error_description || data.error || response.statusText}`
    );
  }

  const token: string = data.access_token;
  cachedAccessToken = token;
  // expires_in is in seconds
  const expiresInSeconds = data.expires_in || 3599;
  tokenExpiresAt = now + expiresInSeconds * 1000;

  return token;
}

/**
 * Helper to record an email in the email_logs table without interrupting flow on logging error.
 */
async function logEmailSent({
  recipient,
  subject,
  html,
  templateKey,
  status,
  errorMessage,
  metadata,
}: {
  recipient: string;
  subject: string;
  html: string;
  templateKey?: string;
  status: "SENT" | "FAILED";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        recipient,
        subject,
        templateKey: templateKey || null,
        status,
        errorMessage: errorMessage || null,
        html,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch (logErr) {
    console.error("[EmailLog] Failed to persist email log to database:", logErr);
  }
}

/**
 * Sends an email using Microsoft Graph sendMail API endpoint and logs the result.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean }> {
  const senderEmail = process.env.MICROSOFT_SENDER_EMAIL || "support@taxcomppro.com";
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const recipientStr = recipients.join(", ");

  let accessToken: string;
  try {
    accessToken = await getMicrosoftGraphAccessToken();
  } catch (tokenErr) {
    const errorMsg = tokenErr instanceof Error ? tokenErr.message : "Failed to obtain access token";
    await logEmailSent({
      recipient: recipientStr,
      subject: options.subject,
      html: options.html,
      templateKey: options.templateKey,
      status: "FAILED",
      errorMessage: errorMsg,
      metadata: options.metadata,
    });
    throw tokenErr;
  }

  const toRecipients = recipients.map((email) => ({
    emailAddress: {
      address: email.trim(),
    },
  }));

  const senderName = process.env.MICROSOFT_SENDER_NAME || "Tax Compliance Pro Support";

  const payload = {
    message: {
      subject: options.subject,
      from: {
        emailAddress: {
          name: senderName,
          address: senderEmail,
        },
      },
      body: {
        contentType: "HTML",
        content: options.html,
      },
      toRecipients,
    },
    saveToSentItems: false,
  };

  const sendEndpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`;

  try {
    const response = await fetch(sendEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Microsoft Graph] sendMail failed:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });

      const failureMessage = `HTTP ${response.status} ${response.statusText} - ${errorText}`;
      await logEmailSent({
        recipient: recipientStr,
        subject: options.subject,
        html: options.html,
        templateKey: options.templateKey,
        status: "FAILED",
        errorMessage: failureMessage,
        metadata: options.metadata,
      });

      throw new Error(`Failed to send email via Microsoft Graph: ${failureMessage}`);
    }

    // Success log
    await logEmailSent({
      recipient: recipientStr,
      subject: options.subject,
      html: options.html,
      templateKey: options.templateKey,
      status: "SENT",
      metadata: options.metadata,
    });

    return { success: true };
  } catch (sendErr) {
    if (sendErr instanceof Error && sendErr.message.includes("Failed to send email via Microsoft Graph")) {
      throw sendErr;
    }
    const errMessage = sendErr instanceof Error ? sendErr.message : "Unknown send error";
    await logEmailSent({
      recipient: recipientStr,
      subject: options.subject,
      html: options.html,
      templateKey: options.templateKey,
      status: "FAILED",
      errorMessage: errMessage,
      metadata: options.metadata,
    });
    throw sendErr;
  }
}

export interface OtpEmailOptions {
  to: string;
  code: string;
  userName?: string;
  expiresInMinutes?: number;
}

/**
 * Sends the registration one-time passcode.
 * Uses dynamic template from database if active, otherwise uses standard default layout.
 */
export async function sendOtpEmail({
  to,
  code,
  userName,
  expiresInMinutes = 10,
}: OtpEmailOptions): Promise<{ success: boolean }> {
  // Check if admin has customized this template in the database
  try {
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: { key: "OTP_VERIFICATION" },
    });

    if (customTemplate && customTemplate.isActive) {
      const { subject, html } = renderDynamicEmail({
        template: customTemplate,
        variables: {
          code,
          userName: userName?.trim() || "there",
          email: to,
          expiresInMinutes,
        },
      });

      return sendEmail({
        to,
        subject,
        html,
        templateKey: "OTP_VERIFICATION",
        metadata: { code, userName, expiresInMinutes },
      });
    }
  } catch (err) {
    console.warn("[Email] Falling back to default OTP template:", err);
  }

  // Default hardcoded fallback
  const subject = `${code} is your Tax Compliance Pro verification code`;
  const greeting = userName?.trim() ? `Hi ${escapeHtml(userName.trim())},` : "Hi there,";

  const body = [
    renderText(greeting),
    renderText(
      `Enter this code to confirm <strong style="color:${BRAND.heading};" class="dark-heading">${escapeHtml(to)}</strong> and finish creating your account.`
    ),
    renderOtpCode(code),
    renderPanel(
      `<p style="font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.body};margin:0;" class="dark-body">
        <strong style="color:${BRAND.heading};" class="dark-heading">This code expires in ${expiresInMinutes} minutes.</strong>
        If you did not try to create an account, you can ignore this email and no account will be made.
        Never share this code with anyone, including someone claiming to be from Tax Compliance Pro.
      </p>`,
      true
    ),
  ].join("\n");

  return sendEmail({
    to,
    subject,
    html: renderEmailShell({
      preheader: `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
      heading: "Confirm your email address",
      body,
      footerNote: "This code was requested during sign up on taxcomppro.com.",
    }),
    templateKey: "OTP_VERIFICATION",
    metadata: { code, userName, expiresInMinutes },
  });
}

/**
 * Sends a password reset email to the user with Tax Compliance Pro branding.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName = "Member",
}: PasswordResetEmailOptions): Promise<{ success: boolean }> {
  try {
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: { key: "PASSWORD_RESET" },
    });

    if (customTemplate && customTemplate.isActive) {
      const { subject, html } = renderDynamicEmail({
        template: customTemplate,
        variables: {
          userName,
          email: to,
          resetUrl,
        },
      });

      return sendEmail({
        to,
        subject,
        html,
        templateKey: "PASSWORD_RESET",
        metadata: { userName, resetUrl },
      });
    }
  } catch (err) {
    console.warn("[Email] Falling back to default Password Reset template:", err);
  }

  const subject = "Reset your Tax Compliance Pro password";

  const body = [
    renderText(`Hello ${escapeHtml(userName)},`),
    renderText(
      `We received a request to reset the password for the account linked to <strong style="color:${BRAND.heading};" class="dark-heading">${escapeHtml(to)}</strong>.`
    ),
    renderText("Choose a new password using the button below."),
    renderButton({ href: resetUrl, label: "Reset password" }),
    renderPanel(
      `<p style="font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.body};margin:0;" class="dark-body">
        <strong style="color:${BRAND.heading};" class="dark-heading">Security notice.</strong>
        This link is valid for 60 minutes and can be used once. If you did not request a reset,
        you can safely ignore this email. Your account stays secure and your password is unchanged.
      </p>`,
      true
    ),
    `<p style="font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${BRAND.muted};margin:0;word-break:break-all;" class="dark-muted">
      If the button does not work, paste this link into your browser:<br />
      <a href="${escapeHtml(resetUrl)}" target="_blank" rel="noopener noreferrer" style="color:${BRAND.gold};text-decoration:none;">${escapeHtml(resetUrl)}</a>
    </p>`,
  ].join("\n");

  return sendEmail({
    to,
    subject,
    html: renderEmailShell({
      preheader: "Reset your password. This link is valid for 60 minutes.",
      heading: "Reset your password",
      body,
    }),
    templateKey: "PASSWORD_RESET",
    metadata: { userName, resetUrl },
  });
}

export interface SupportTicketEmailOptions {
  to: string;
  userName: string;
  ticketId: string;
  subject: string;
  description: string;
}

export interface SupportTicketUpdatedOptions {
  to: string;
  userName: string;
  ticketId: string;
  subject: string;
  status: string;
  feedback?: string;
}

export interface MembershipUpgradeEmailOptions {
  to: string;
  userName: string;
  tier: string;
  currentPeriodEnd?: Date | string;
  months?: number;
  isComplimentary?: boolean;
}

/**
 * Sends a confirmation email to the user who opened a ticket AND an alert to the support team.
 */
export async function sendSupportTicketCreatedEmail({
  to,
  userName = "Member",
  ticketId,
  subject: ticketSubject,
  description,
}: SupportTicketEmailOptions): Promise<{ success: boolean }> {
  const shortId = ticketId.slice(-6).toUpperCase();
  const senderEmail = process.env.MICROSOFT_SENDER_EMAIL || "support@taxcomppro.com";

  // 1. Send confirmation to user
  try {
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: { key: "SUPPORT_TICKET_CREATED" },
    });

    if (customTemplate && customTemplate.isActive) {
      const { subject, html } = renderDynamicEmail({
        template: customTemplate,
        variables: {
          userName,
          email: to,
          ticketId,
          ticketShortId: shortId,
          subject: ticketSubject,
          description,
          dashboardUrl: `${BRAND.site}/feed`,
        },
      });

      await sendEmail({
        to,
        subject,
        html,
        templateKey: "SUPPORT_TICKET_CREATED",
        metadata: { ticketId, ticketShortId: shortId, ticketSubject },
      });
    } else {
      const quotedMessage = `
        <div style="font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND.muted};margin:16px 0 8px 0;" class="dark-muted">Your message</div>
        <div style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:8px;padding:14px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.body};white-space:pre-wrap;" class="dark-body dark-surface">${escapeHtml(description)}</div>`;

      const userBody = [
        renderText(`Hello ${escapeHtml(userName)},`),
        renderText("Thanks for reaching out. Your request is logged and our support team has been notified."),
        renderPanel(
          renderRow("Ticket", `#${escapeHtml(shortId)}`) +
            renderRow("Status", renderBadge("Open", "info")) +
            renderRow("Subject", escapeHtml(ticketSubject)) +
            quotedMessage
        ),
        renderText(
          "Our team usually responds within 24 business hours. You can also track this ticket from the Concierge widget once you are signed in."
        ),
        renderButton({ href: `${BRAND.site}/feed`, label: "Open your dashboard" }),
      ].join("\n");

      await sendEmail({
        to,
        subject: `[Ticket #${shortId}] We received your request: ${ticketSubject}`,
        html: renderEmailShell({
          preheader: `Ticket #${shortId} is open. We usually reply within 24 business hours.`,
          heading: "We received your request",
          body: userBody,
        }),
        templateKey: "SUPPORT_TICKET_CREATED",
        metadata: { ticketId, ticketShortId: shortId, ticketSubject },
      });
    }
  } catch (err) {
    console.error("[Support Email] Failed sending ticket creation email to user:", err);
  }

  // 2. Alert admin team
  if (senderEmail && senderEmail !== to) {
    try {
      const adminAlertTemplate = await prisma.emailTemplate.findUnique({
        where: { key: "SUPPORT_TICKET_ADMIN_ALERT" },
      });

      if (adminAlertTemplate && adminAlertTemplate.isActive) {
        const { subject, html } = renderDynamicEmail({
          template: adminAlertTemplate,
          variables: {
            userName,
            email: to,
            ticketId,
            ticketShortId: shortId,
            subject: ticketSubject,
            description,
            adminUrl: `${BRAND.site}/admin/support`,
          },
        });

        sendEmail({
          to: senderEmail,
          subject,
          html,
          templateKey: "SUPPORT_TICKET_ADMIN_ALERT",
          metadata: { ticketId, ticketShortId: shortId, fromUser: to },
        }).catch((err) => console.error("[Microsoft Graph] Failed to alert admin team:", err));
      } else {
        const quotedMessage = `
          <div style="font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND.muted};margin:16px 0 8px 0;" class="dark-muted">Your message</div>
          <div style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:8px;padding:14px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.body};white-space:pre-wrap;" class="dark-body dark-surface">${escapeHtml(description)}</div>`;

        const adminBody = [
          renderText(`New support ticket <strong style="color:${BRAND.heading};" class="dark-heading">#${escapeHtml(shortId)}</strong> was opened.`),
          renderPanel(
            renderRow("From", escapeHtml(userName)) +
              renderRow("Email", escapeHtml(to)) +
              renderRow("Ticket ID", escapeHtml(ticketId)) +
              renderRow("Subject", escapeHtml(ticketSubject)) +
              quotedMessage
          ),
          renderButton({ href: `${BRAND.site}/admin/support`, label: "Open in admin" }),
        ].join("\n");

        sendEmail({
          to: senderEmail,
          subject: `[New ticket #${shortId}] ${ticketSubject} (from ${userName})`,
          html: renderEmailShell({
            preheader: `${userName} opened ticket #${shortId}: ${ticketSubject}`,
            heading: `New support ticket #${shortId}`,
            body: adminBody,
          }),
          templateKey: "SUPPORT_TICKET_ADMIN_ALERT",
          metadata: { ticketId, ticketShortId: shortId, fromUser: to },
        }).catch((err) => console.error("[Microsoft Graph] Failed to alert admin team:", err));
      }
    } catch (err) {
      console.error("[Support Email] Failed sending admin alert:", err);
    }
  }

  return { success: true };
}

/**
 * Sends a status or feedback update email to the ticket creator.
 */
export async function sendSupportTicketUpdatedEmail({
  to,
  userName = "Member",
  ticketId,
  subject: ticketSubject,
  status,
  feedback,
}: SupportTicketUpdatedOptions): Promise<{ success: boolean }> {
  const shortId = ticketId.slice(-6).toUpperCase();
  const statusLabel =
    status === "RESOLVED" ? "Resolved" : status === "IN_PROGRESS" ? "In progress" : "Open";

  try {
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: { key: "SUPPORT_TICKET_UPDATED" },
    });

    if (customTemplate && customTemplate.isActive) {
      const { subject, html } = renderDynamicEmail({
        template: customTemplate,
        variables: {
          userName,
          email: to,
          ticketId,
          ticketShortId: shortId,
          subject: ticketSubject,
          status,
          statusLabel,
          feedback: feedback || "No additional feedback provided.",
          dashboardUrl: `${BRAND.site}/feed`,
        },
      });

      return sendEmail({
        to,
        subject,
        html,
        templateKey: "SUPPORT_TICKET_UPDATED",
        metadata: { ticketId, status, feedback },
      });
    }
  } catch (err) {
    console.warn("[Email] Falling back to default ticket updated template:", err);
  }

  const subject = `[Ticket #${shortId}] Update on your request: ${ticketSubject}`;
  const statusTone: "success" | "warning" | "info" =
    status === "RESOLVED" ? "success" : status === "IN_PROGRESS" ? "warning" : "info";

  const feedbackBlock = feedback
    ? `<div style="font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND.muted};margin:16px 0 8px 0;" class="dark-muted">Response from support</div>
       <div style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:8px;padding:14px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.body};white-space:pre-wrap;" class="dark-body dark-surface">${escapeHtml(feedback)}</div>`
    : "";

  const body = [
    renderText(`Hello ${escapeHtml(userName)},`),
    renderText(`There is an update on your support request <strong style="color:${BRAND.heading};" class="dark-heading">#${escapeHtml(shortId)}</strong>.`),
    renderPanel(
      renderRow("Ticket", `#${escapeHtml(shortId)}`) +
        renderRow("Status", renderBadge(statusLabel, statusTone)) +
        renderRow("Subject", escapeHtml(ticketSubject)) +
        feedbackBlock
    ),
    renderText("You can review the full history or reply from the Concierge support panel."),
    renderButton({ href: `${BRAND.site}/feed`, label: "View your ticket" }),
  ].join("\n");

  return sendEmail({
    to,
    subject,
    html: renderEmailShell({
      preheader: `Ticket #${shortId} is now ${statusLabel.toLowerCase()}.`,
      heading: "Update on your support request",
      body,
    }),
    templateKey: "SUPPORT_TICKET_UPDATED",
    metadata: { ticketId, status, feedback },
  });
}

/**
 * Sends a confirmation email when a member upgrades their membership tier.
 */
export async function sendMembershipUpgradedEmail({
  to,
  userName = "Valued Member",
  tier,
  currentPeriodEnd,
  isComplimentary = false,
}: MembershipUpgradeEmailOptions): Promise<{ success: boolean }> {
  const tierNameMap: Record<string, string> = {
    FREE: "Basic Membership",
    VIP: "VIP Membership",
    MARKETPLACE: "VIP + Marketplace Bundle",
    MARKETPLACE_PLUS: "VIP + Marketplace Plus",
  };

  const displayName = tierNameMap[tier] || `${tier} Membership`;
  const dateFormatted = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Lifetime / Indefinite";

  try {
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: { key: "MEMBERSHIP_UPGRADED" },
    });

    if (customTemplate && customTemplate.isActive) {
      const { subject, html } = renderDynamicEmail({
        template: customTemplate,
        variables: {
          userName,
          email: to,
          tier,
          tierName: displayName,
          periodEndFormatted: dateFormatted,
          isComplimentary: isComplimentary ? "true" : "false",
          dashboardUrl: `${BRAND.site}/feed`,
        },
      });

      return sendEmail({
        to,
        subject,
        html,
        templateKey: "MEMBERSHIP_UPGRADED",
        metadata: { tier, currentPeriodEnd, isComplimentary },
      });
    }
  } catch (err) {
    console.warn("[Email] Falling back to default membership upgraded template:", err);
  }

  const subject = `Your ${displayName} is active`;

  const perks = [
    ...(tier === "VIP" || tier === "MARKETPLACE" || tier === "MARKETPLACE_PLUS"
      ? [
          "Full feed interaction: post insights, like, and comment with top tax pros",
          "Private messaging and 1-on-1 networking with verified peers",
          "Interactive ATLAS AI Tax Bot and due diligence toolkit resources",
          "Access to Pro Talks live audio and community discussions",
        ]
      : []),
    ...(tier === "MARKETPLACE" || tier === "MARKETPLACE_PLUS"
      ? [
          "Custom seller profile and the ability to list professional tax services",
          "Featured inclusion in the Tax Compliance Pro Marketplace directory",
          "Receive client leads and accept direct service bookings",
        ]
      : []),
    ...(tier === "MARKETPLACE_PLUS"
      ? [
          "Host live interactive audio and video sessions with your own audience",
          "Post sponsored ads, products, and training courses across the platform",
          "Top-tier badge distinction across all posts and community channels",
        ]
      : []),
  ];

  // Perks as a table so the checkmark column stays aligned without flexbox.
  const perkRows = perks
    .map(
      (p) => `
    <tr>
      <td valign="top" width="24" style="font-family:${FONT_STACK};font-size:15px;font-weight:800;color:${BRAND.gold};padding:7px 0;line-height:1.5;">&#10003;</td>
      <td valign="top" style="font-family:${FONT_STACK};font-size:14px;line-height:1.55;color:${BRAND.body};padding:7px 0;" class="dark-body">${escapeHtml(p)}</td>
    </tr>`
    )
    .join("");

  const planCard = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;">
  <tr>
    <td style="background-color:${BRAND.navy};background-image:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyMid} 100%);border-radius:14px;padding:24px;">
      <div style="font-family:${FONT_STACK};font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${BRAND.goldLight};margin-bottom:6px;">Active plan</div>
      <div style="font-family:${FONT_STACK};font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:10px;">${escapeHtml(displayName)}</div>
      <div style="font-family:${FONT_STACK};font-size:13px;color:#a9b8d0;line-height:1.5;">
        Status: <strong style="color:#4ade80;">Active</strong>${
          dateFormatted
            ? `<br />${isComplimentary ? "Complimentary access until" : "Renews on"}: <strong style="color:#ffffff;">${escapeHtml(dateFormatted)}</strong>`
            : ""
        }
      </div>
    </td>
  </tr>
</table>`;

  const body = [
    renderText(`Congratulations, ${escapeHtml(userName)}.`),
    renderText(`Your upgrade is live. Your account now has full access to everything in the ${escapeHtml(displayName)} plan.`),
    planCard,
    `<div style="font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${BRAND.muted};margin:0 0 6px 0;" class="dark-muted">What is included</div>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">${perkRows}</table>`,
    renderButton({ href: `${BRAND.site}/feed`, label: "Go to your dashboard" }),
  ].join("\n");

  return sendEmail({
    to,
    subject,
    html: renderEmailShell({
      preheader: `Your ${displayName} is active. Here is what you can now do.`,
      heading: `Welcome to ${displayName}`,
      body,
      footerNote: `This email was sent to ${escapeHtml(to)} about your Tax Compliance Pro membership.`,
    }),
    templateKey: "MEMBERSHIP_UPGRADED",
    metadata: { tier, currentPeriodEnd, isComplimentary },
  });
}

export {
  sendWelcomeEmail,
  renderWelcomeEmailHtml,
  extractFirstName,
} from "@/lib/welcome-email";
export type { WelcomeEmailOptions } from "@/lib/welcome-email";
