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

/**
 * Sends a password reset email to the user with Tax Compliance Pro branding.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName = "Member",
}: PasswordResetEmailOptions): Promise<{ success: boolean }> {
  const subject = "Reset Your Tax Compliance Pro Password";
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 580px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%);
      padding: 32px 30px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      color: #f0c040;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      margin: 4px 0 0 0;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0a1628;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(90deg, #f0c040 0%, #d4a017 100%);
      color: #0a1628 !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 9999px;
      box-shadow: 0 4px 14px rgba(212, 160, 23, 0.35);
      letter-spacing: 0.3px;
    }
    .notice-box {
      background-color: #f8fafc;
      border-left: 4px solid #d4a017;
      padding: 14px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .fallback-url {
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      line-height: 1.4;
      margin-top: 24px;
    }
    .fallback-url a {
      color: #d4a017;
      text-decoration: none;
    }
    .footer {
      border-top: 1px solid #f1f5f9;
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header" style="background: linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%); padding: 32px 30px; text-align: center;">
          <img src="https://taxcomppro.com/logo_dark.webp" alt="Tax Compliance Pro" width="170" style="display: block; margin: 0 auto 12px auto; max-width: 170px; height: auto; border: 0;" />
          <div class="brand-subtitle" style="color: #f0c040; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">#1 TAX PREPARER AUDIT PROTECTION</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2 class="greeting">Hello ${userName},</h2>
          <p class="text">
            We received a request to reset the password for your Tax Compliance Pro account associated with <strong>${to}</strong>.
          </p>
          <p class="text">
            Click the button below to choose a new password:
          </p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
              Reset Password &rarr;
            </a>
          </div>
          <div class="notice-box">
            <strong>Security Notice:</strong> This password reset link is valid for <strong>60 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.
          </div>
          <div class="fallback-url">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} Tax Compliance Pro. All rights reserved.</p>
          <p>For questions or assistance, contact <a href="mailto:support@taxcomppro.com" style="color: #64748b; text-decoration: underline;">support@taxcomppro.com</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
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
  const subject = `[Ticket #${shortId}] Support Request Received: ${ticketSubject}`;
  const senderEmail = process.env.MICROSOFT_SENDER_EMAIL || "support@taxcomppro.com";

  // 1. User confirmation email
  const userHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 580px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%); padding: 32px 30px; text-align: center; }
    .brand-subtitle { color: #f0c040; font-size: 11px; font-weight: 700; letter-spacing: 2px; margin: 4px 0 0 0; text-transform: uppercase; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0a1628; margin-top: 0; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .ticket-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .ticket-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .ticket-label { font-weight: 700; color: #64748b; }
    .ticket-value { font-weight: 600; color: #0a1628; text-align: right; }
    .badge-open { display: inline-block; background-color: #eff6ff; color: #2563eb; font-weight: 800; font-size: 11px; padding: 2px 10px; border-radius: 9999px; border: 1px solid #bfdbfe; }
    .desc-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 13px; color: #334155; line-height: 1.5; white-space: pre-wrap; }
    .footer { border-top: 1px solid #f1f5f9; background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          <img src="https://taxcomppro.com/logo_dark.webp" alt="Tax Compliance Pro" width="170" style="display: block; margin: 0 auto 12px auto; max-width: 170px; height: auto; border: 0;" />
          <div class="brand-subtitle">#1 TAX PREPARER AUDIT PROTECTION</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2 class="greeting">Hello ${userName},</h2>
          <p class="text">
            Thank you for reaching out. We have received your support request and our team has been notified.
          </p>
          <div class="ticket-card">
            <div style="margin-bottom: 8px;">
              <span style="font-size: 12px; color: #64748b; font-weight: bold;">TICKET NUMBER:</span>
              <span style="font-size: 14px; font-weight: 800; color: #0a1628; margin-left: 6px;">#${shortId}</span>
              <span class="badge-open" style="float: right;">OPEN</span>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="font-size: 12px; color: #64748b; font-weight: bold;">SUBJECT:</span>
              <span style="font-size: 13px; font-weight: 700; color: #0a1628; margin-left: 6px;">${ticketSubject}</span>
            </div>
            <div style="font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 4px;">YOUR MESSAGE:</div>
            <div class="desc-box">${description}</div>
          </div>
          <p class="text" style="margin-bottom: 12px;">
            Our dedicated support team typically reviews and responds within <strong>24 business hours</strong>. You can also view status updates anytime directly through your Concierge widget on <a href="https://taxcomppro.com" style="color: #d4a017; font-weight: 700; text-decoration: none;">taxcomppro.com</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} Tax Compliance Pro. All rights reserved.</p>
          <p>For urgent questions, you can reply directly to this email.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  // 2. Admin notification email
  const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #1e293b; padding: 20px;">
  <div style="background: #0a1628; color: #f0c040; padding: 16px; border-radius: 8px; font-weight: bold; font-size: 16px;">
    🚨 New Support Ticket: #${shortId}
  </div>
  <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 16px; background: #fafafa;">
    <p><strong>From:</strong> ${userName} (&lt;${to}&gt;)</p>
    <p><strong>Subject:</strong> ${ticketSubject}</p>
    <p><strong>Ticket ID:</strong> ${ticketId}</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    <p><strong>Description:</strong></p>
    <div style="background: #fff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; white-space: pre-wrap;">${description}</div>
    <div style="margin-top: 20px;">
      <a href="https://taxcomppro.com/admin/support" style="background: #0a1628; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: bold;">
        View in Admin Portal &rarr;
      </a>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Send to user
  await sendEmail({
    to,
    subject,
    html: userHtml,
  });

  // Alert admin team (non-blocking if admin alert fails)
  if (senderEmail && senderEmail !== to) {
    sendEmail({
      to: senderEmail,
      subject: `🚨 [New Ticket #${shortId}] ${ticketSubject} (from ${userName})`,
      html: adminHtml,
    }).catch(err => console.error("[Microsoft Graph] Failed to alert admin team:", err));
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
  const subject = `[Ticket #${shortId}] Update on Your Support Request: ${ticketSubject}`;

  const statusLabel =
    status === "RESOLVED" ? "Resolved" :
    status === "IN_PROGRESS" ? "In Progress" : "Open";

  const statusColor =
    status === "RESOLVED" ? "#16a34a" :
    status === "IN_PROGRESS" ? "#d97706" : "#2563eb";

  const statusBg =
    status === "RESOLVED" ? "#dcfce7" :
    status === "IN_PROGRESS" ? "#fef3c7" : "#eff6ff";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 580px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%); padding: 32px 30px; text-align: center; }
    .brand-subtitle { color: #f0c040; font-size: 11px; font-weight: 700; letter-spacing: 2px; margin: 4px 0 0 0; text-transform: uppercase; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0a1628; margin-top: 0; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .footer { border-top: 1px solid #f1f5f9; background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          <img src="https://taxcomppro.com/logo_dark.webp" alt="Tax Compliance Pro" width="170" style="display: block; margin: 0 auto 12px auto; max-width: 170px; height: auto; border: 0;" />
          <div class="brand-subtitle">#1 TAX PREPARER AUDIT PROTECTION</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2 class="greeting">Hello ${userName},</h2>
          <p class="text">
            There is an update on your support request <strong>#${shortId}</strong> (${ticketSubject}).
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 12px; color: #64748b; font-weight: bold;">CURRENT STATUS:</span>
              <span style="background-color: ${statusBg}; color: ${statusColor}; font-weight: 800; font-size: 12px; padding: 3px 12px; border-radius: 9999px;">
                ${statusLabel}
              </span>
            </div>
            ${feedback ? `
            <div style="font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 6px;">RESPONSE FROM SUPPORT TEAM:</div>
            <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; font-size: 13px; color: #0a1628; line-height: 1.6; white-space: pre-wrap;">${feedback}</div>
            ` : ""}
          </div>
          <p class="text">
            You can check your ticket history or send a reply anytime via the Concierge Support panel on <a href="https://taxcomppro.com" style="color: #d4a017; font-weight: 700; text-decoration: none;">taxcomppro.com</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} Tax Compliance Pro. All rights reserved.</p>
          <p>For questions, contact <a href="mailto:support@taxcomppro.com" style="color: #64748b; text-decoration: underline;">support@taxcomppro.com</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * Sends a celebration and confirmation email when a member upgrades their membership tier.
 */
export async function sendMembershipUpgradedEmail({
  to,
  userName = "Valued Member",
  tier,
  currentPeriodEnd,
  months,
  isComplimentary = false,
}: MembershipUpgradeEmailOptions): Promise<{ success: boolean }> {
  const tierNameMap: Record<string, string> = {
    FREE: "Basic Membership",
    VIP: "VIP Membership",
    MARKETPLACE: "VIP + Marketplace Bundle",
    MARKETPLACE_PLUS: "VIP + Marketplace Plus",
  };

  const displayName = tierNameMap[tier] || `${tier} Membership`;
  const subject = `🎉 Welcome to Tax Compliance Pro ${displayName}!`;

  // Perks bullet points based on tier
  const perks = [
    ...(tier === "VIP" || tier === "MARKETPLACE" || tier === "MARKETPLACE_PLUS" ? [
      "Full feed interaction: post insights, like, and comment with top tax pros",
      "Private messaging & 1-on-1 networking with verified peers",
      "Interactive ATLAS AI Tax Bot & due diligence toolkit resources",
      "Access to Pro Talks live audio & community discussions",
    ] : []),
    ...(tier === "MARKETPLACE" || tier === "MARKETPLACE_PLUS" ? [
      "Custom Seller Profile & ability to list professional tax services",
      "Featured inclusion in the Tax Compliance Pro Marketplace directory",
      "Receive client leads and accept direct service bookings",
    ] : []),
    ...(tier === "MARKETPLACE_PLUS" ? [
      "Host live interactive audio & video sessions with your own audience",
      "Post sponsored ads, products, and training courses across the platform",
      "Top-tier badge distinction across all posts and community channels",
    ] : []),
  ];

  const dateFormatted = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 580px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%); padding: 36px 30px; text-align: center; }
    .brand-subtitle { color: #f0c040; font-size: 11px; font-weight: 700; letter-spacing: 2px; margin: 4px 0 0 0; text-transform: uppercase; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 20px; font-weight: 800; color: #0a1628; margin-top: 0; margin-bottom: 12px; }
    .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .plan-card { background: linear-gradient(135deg, #0a1628 0%, #0d1e4a 100%); color: #ffffff; border-radius: 14px; padding: 22px; margin: 24px 0; box-shadow: 0 10px 25px -5px rgba(10,22,40,0.25); }
    .plan-tag { color: #f0c040; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
    .plan-name { font-size: 22px; font-weight: 900; margin: 0 0 8px 0; }
    .plan-meta { font-size: 13px; color: #94a3b8; }
    .perks-list { list-style: none; padding: 0; margin: 20px 0; }
    .perks-item { font-size: 14px; color: #334155; padding: 8px 0 8px 24px; position: relative; line-height: 1.5; }
    .perks-item::before { content: "✓"; position: absolute; left: 0; color: #d4a017; font-weight: 900; font-size: 16px; }
    .btn-container { text-align: center; margin: 32px 0 20px 0; }
    .btn { display: inline-block; background: linear-gradient(90deg, #f0c040 0%, #d4a017 100%); color: #0a1628 !important; text-decoration: none; font-size: 15px; font-weight: 800; padding: 15px 38px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(212, 160, 23, 0.35); }
    .footer { border-top: 1px solid #f1f5f9; background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td class="header">
          <img src="https://taxcomppro.com/logo_dark.webp" alt="Tax Compliance Pro" width="170" style="display: block; margin: 0 auto 12px auto; max-width: 170px; height: auto; border: 0;" />
          <div class="brand-subtitle">#1 TAX PREPARER AUDIT PROTECTION</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2 class="greeting">Congratulations, ${userName}! 🎉</h2>
          <p class="text">
            Your membership upgrade is active! Your account now has full access to the professional features and resources of the <strong>${displayName}</strong> plan.
          </p>

          <div class="plan-card">
            <div class="plan-tag">ACTIVATED MEMBERSHIP PLAN</div>
            <div class="plan-name">${displayName}</div>
            <div class="plan-meta">
              Status: <span style="color: #4ade80; font-weight: bold;">Active</span>
              ${dateFormatted ? ` &middot; ${isComplimentary ? "Complimentary access until" : "Renews on"}: <strong>${dateFormatted}</strong>` : ""}
            </div>
          </div>

          <div style="font-weight: 800; color: #0a1628; font-size: 14px; margin-bottom: 10px;">
            WHAT'S INCLUDED IN YOUR MEMBERSHIP:
          </div>
          <ul class="perks-list">
            ${perks.map(p => `<li class="perks-item">${p}</li>`).join("")}
          </ul>

          <div class="btn-container">
            <a href="https://taxcomppro.com/feed" class="btn" target="_blank" rel="noopener noreferrer">
              Go to Your Feed &amp; Dashboard &rarr;
            </a>
          </div>

          <p class="text" style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">
            Need help getting started or have questions? Reach out to our concierge support team anytime at <a href="mailto:support@taxcomppro.com" style="color: #d4a017; font-weight: bold;">support@taxcomppro.com</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>&copy; ${new Date().getFullYear()} Tax Compliance Pro. All rights reserved.</p>
          <p>This email was sent to ${to} for your Tax Compliance Pro membership.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
  });
}
