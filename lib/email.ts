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

  const payload = {
    message: {
      subject: options.subject,
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
        <td class="header">
          <div class="brand-title">TAX COMPLIANCE PRO</div>
          <div class="brand-subtitle">#1 TAX PREPARER AUDIT PROTECTION</div>
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
