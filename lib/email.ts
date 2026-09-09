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

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface PasswordResetEmailOptions {
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
 * Sends an email using Microsoft Graph sendMail API endpoint.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean }> {
  const senderEmail = process.env.MICROSOFT_SENDER_EMAIL || "support@taxcomppro.com";
  const accessToken = await getMicrosoftGraphAccessToken();

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
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
    throw new Error(`Failed to send email via Microsoft Graph: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return { success: true };
}

export interface OtpEmailOptions {
  to: string;
  code: string;
  userName?: string;
  expiresInMinutes?: number;
}

/**
 * Sends the registration one-time passcode.
 * The code itself is the hero of this email, so the layout keeps everything else quiet.
 */
export async function sendOtpEmail({
  to,
  code,
  userName,
  expiresInMinutes = 10,
}: OtpEmailOptions): Promise<{ success: boolean }> {
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
  const subject = `[Ticket #${shortId}] We received your request: ${ticketSubject}`;
  const senderEmail = process.env.MICROSOFT_SENDER_EMAIL || "support@taxcomppro.com";

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

  // Internal alert. Plain and scannable, no marketing shell needed.
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

  // Send to user
  await sendEmail({
    to,
    subject,
    html: renderEmailShell({
      preheader: `Ticket #${shortId} is open. We usually reply within 24 business hours.`,
      heading: "We received your request",
      body: userBody,
    }),
  });

  // Alert admin team (non-blocking if admin alert fails)
  if (senderEmail && senderEmail !== to) {
    sendEmail({
      to: senderEmail,
      subject: `[New ticket #${shortId}] ${ticketSubject} (from ${userName})`,
      html: renderEmailShell({
        preheader: `${userName} opened ticket #${shortId}: ${ticketSubject}`,
        heading: `New support ticket #${shortId}`,
        body: adminBody,
      }),
    }).catch((err) => console.error("[Microsoft Graph] Failed to alert admin team:", err));
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
  const subject = `[Ticket #${shortId}] Update on your request: ${ticketSubject}`;

  const statusLabel =
    status === "RESOLVED" ? "Resolved" : status === "IN_PROGRESS" ? "In progress" : "Open";
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

  const dateFormatted = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
  });
}
