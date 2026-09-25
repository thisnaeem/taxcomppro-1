import { escapeHtml } from "@/lib/email-template";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_ALERT_EMAIL || "info@taxcomppro.com";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.taxcomppro.com";

function formatMoney(amountCents?: number | null, currency = "usd"): string {
  if (amountCents === undefined || amountCents === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function renderAdminEmailShell({
  badgeText,
  badgeBg = "#3b82f6",
  badgeColor = "#ffffff",
  title,
  subtitle,
  tableRows,
  actionUrl,
  actionLabel = "Open Admin Dashboard →",
}: {
  badgeText: string;
  badgeBg?: string;
  badgeColor?: string;
  title: string;
  subtitle: string;
  tableRows: Array<{ label: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}): string {
  const rowsHtml = tableRows
    .map(
      (r, i) => `
    <tr style="background:${i % 2 === 0 ? "rgba(11,26,48,0.75)" : "rgba(7,17,32,0.45)"};">
      <td style="padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#8b9bb4;width:34%;border-bottom:1px solid rgba(139,155,180,0.15);">${escapeHtml(
        r.label
      )}</td>
      <td style="padding:12px 16px;font-size:14px;color:#ffffff;font-weight:600;border-bottom:1px solid rgba(139,155,180,0.15);word-break:break-word;">${r.value}</td>
    </tr>`
    )
    .join("");

  const buttonHtml = actionUrl
    ? `
    <tr>
      <td align="center" style="padding:28px 24px 10px;">
        <a href="${escapeHtml(
          actionUrl
        )}" target="_blank" style="display:inline-block;background:#d4af37;background-image:linear-gradient(135deg,#f3d98b 0%,#d4af37 55%,#b8892b 100%);color:#071120;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:14px 32px;border-radius:50px;text-decoration:none;box-shadow:0 6px 18px rgba(212,175,55,0.35);">
          ${escapeHtml(actionLabel)}
        </a>
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body, table, td, p, a { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
</style>
</head>
<body style="margin:0;padding:24px 12px;background:#071120;background-image:linear-gradient(160deg,#071120 0%,#0a2342 50%,#0b2f3a 100%);color:#d6deea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0b1a30;border:1px solid rgba(243,217,139,0.3);border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.5);">
          <!-- Gold Bar -->
          <tr><td height="5" style="height:5px;line-height:5px;font-size:0;background:#d4af37;background-image:linear-gradient(90deg,#b8892b,#f3d98b,#d4af37,#f3d98b,#b8892b);">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 14px;border-bottom:1px solid rgba(139,155,180,0.2);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:11px;letter-spacing:3px;font-weight:800;color:#f3d98b;text-transform:uppercase;">TAX COMP PRO</span>
                    <span style="font-size:11px;color:#8b9bb4;letter-spacing:1px;margin-left:8px;text-transform:uppercase;">&bull;&nbsp;Admin Alert</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:5px 12px;border-radius:30px;background:${badgeBg};color:${badgeColor};font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">
                      ${escapeHtml(badgeText)}
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:16px 0 6px;font-size:24px;line-height:30px;font-weight:800;color:#ffffff;">${escapeHtml(
                title
              )}</h1>
              <p style="margin:0;font-size:14px;line-height:20px;color:#c9d3e3;">${escapeHtml(
                subtitle
              )}</p>
            </td>
          </tr>

          <!-- Details Table -->
          <tr>
            <td style="padding:20px 36px 10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(139,155,180,0.2);border-radius:12px;overflow:hidden;">
                ${rowsHtml}
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          ${buttonHtml}

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:22px 36px 26px;border-top:1px solid rgba(139,155,180,0.15);font-size:11px;color:#7d8ca5;line-height:16px;">
              This notification was generated automatically and sent to <strong>${escapeHtml(
                ADMIN_NOTIFICATION_EMAIL
              )}</strong>.<br />
              Tax Comp Pro Administrator Security &bull; ${new Date().toUTCString()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NEW SIGN-UP NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminSignupNotificationParams {
  id?: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role?: string | null;
  tier?: string | null;
  professionalTitle?: string | null;
}

export async function notifyAdminNewSignup(
  user: AdminSignupNotificationParams
): Promise<{ success: boolean }> {
  const recipient = ADMIN_NOTIFICATION_EMAIL;
  const userEmail = (user.email || "").trim().toLowerCase();
  if (!userEmail) return { success: false };

  // Deduplication check: check if already notified for this user in last hour
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await prisma.emailLog.findFirst({
      where: {
        recipient,
        templateKey: "ADMIN_ALERT_SIGNUP",
        subject: { contains: userEmail },
        createdAt: { gte: oneHourAgo },
      },
    });
    if (existing) {
      return { success: true };
    }
  } catch (err) {
    console.warn("[Admin Notification] Check error:", err);
  }

  const displayName = user.name?.trim() || "New Member";
  const subject = `🔔 New Member Sign-up: ${displayName} (${userEmail})`;
  const nowFormatted = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }) + " ET";

  const tableRows = [
    { label: "Name", value: escapeHtml(displayName) },
    { label: "Email", value: `<a href="mailto:${escapeHtml(userEmail)}" style="color:#f3d98b;text-decoration:none;">${escapeHtml(userEmail)}</a>` },
    ...(user.phone ? [{ label: "Phone", value: escapeHtml(user.phone) }] : []),
    ...(user.professionalTitle ? [{ label: "Title / Pro Role", value: escapeHtml(user.professionalTitle) }] : []),
    { label: "Role", value: `<span style="color:#7fe0b8;">${escapeHtml(user.role || "MEMBER")}</span>` },
    { label: "Initial Tier", value: `<span style="color:#f3d98b;">${escapeHtml(user.tier || "FREE")}</span>` },
    { label: "Signed Up At", value: `${escapeHtml(nowFormatted)}` },
    ...(user.id ? [{ label: "User ID", value: `<code style="font-size:11px;color:#8b9bb4;">${escapeHtml(user.id)}</code>` }] : []),
  ];

  const html = renderAdminEmailShell({
    badgeText: "New Sign-up",
    badgeBg: "#1d4ed8",
    badgeColor: "#ffffff",
    title: "New Member Registration",
    subtitle: `${displayName} has created an account on Tax Comp Pro.`,
    tableRows,
    actionUrl: `${SITE_URL}/admin/users`,
    actionLabel: "View Members in Admin →",
  });

  return sendEmail({
    to: recipient,
    subject,
    html,
    templateKey: "ADMIN_ALERT_SIGNUP",
    metadata: {
      userId: user.id,
      email: userEmail,
      name: displayName,
      role: user.role,
      tier: user.tier,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MEMBERSHIP UPGRADE NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminUpgradeNotificationParams {
  userId: string;
  tier: string;
  previousTier?: string | null;
  stripeSessionId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
}

export async function notifyAdminUpgrade({
  userId,
  tier,
  previousTier,
  stripeSessionId,
  amountTotal,
  currency = "usd",
  customerEmail,
  customerName,
}: AdminUpgradeNotificationParams): Promise<{ success: boolean }> {
  const recipient = ADMIN_NOTIFICATION_EMAIL;

  // Deduplication check based on session ID or user+tier in last 10 minutes
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existing = await prisma.emailLog.findFirst({
      where: {
        recipient,
        templateKey: "ADMIN_ALERT_UPGRADE",
        subject: { contains: stripeSessionId ? stripeSessionId.slice(-10) : userId },
        createdAt: { gte: tenMinAgo },
      },
    });
    if (existing) {
      return { success: true };
    }
  } catch (err) {
    console.warn("[Admin Notification] Check error:", err);
  }

  // Fetch fresh user details from DB
  let user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    })
    .catch(() => null);

  const email = user?.email || customerEmail || "Unknown Email";
  const name = user?.name || customerName || "Member";
  const formattedAmount = amountTotal ? formatMoney(amountTotal, currency || "usd") : "Subscription";

  const tierNames: Record<string, string> = {
    FREE: "Basic Membership (Free)",
    VIP: "VIP Membership",
    MARKETPLACE: "VIP + Marketplace Bundle",
    MARKETPLACE_PLUS: "VIP + Marketplace Plus",
  };
  const tierDisplay = tierNames[tier] || `${tier} Plan`;

  const subject = `⭐ Membership Upgraded: ${name} → ${tier} (${stripeSessionId ? stripeSessionId.slice(-8) : "Active"})`;
  const nowFormatted = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }) + " ET";

  const tableRows = [
    { label: "Member Name", value: escapeHtml(name) },
    { label: "Member Email", value: `<a href="mailto:${escapeHtml(email)}" style="color:#f3d98b;text-decoration:none;">${escapeHtml(email)}</a>` },
    ...(user?.phone ? [{ label: "Phone", value: escapeHtml(user.phone) }] : []),
    { label: "New Plan Tier", value: `<strong style="color:#f3d98b;font-size:15px;">${escapeHtml(tierDisplay)}</strong>` },
    ...(previousTier ? [{ label: "Previous Tier", value: escapeHtml(previousTier) }] : []),
    ...(amountTotal ? [{ label: "Amount Billed", value: `<span style="color:#7fe0b8;font-weight:700;">${formatMoney(amountTotal, currency || "usd")}</span>` }] : []),
    { label: "Upgraded At", value: `${escapeHtml(nowFormatted)}` },
    ...(stripeSessionId ? [{ label: "Stripe Session", value: `<code style="font-size:11px;color:#8b9bb4;">${escapeHtml(stripeSessionId)}</code>` }] : []),
  ];

  const html = renderAdminEmailShell({
    badgeText: "Plan Upgrade",
    badgeBg: "#b45309",
    badgeColor: "#fef3c7",
    title: "Membership Tier Upgraded",
    subtitle: `${name} has upgraded their account to ${tierDisplay}.`,
    tableRows,
    actionUrl: `${SITE_URL}/admin/users`,
    actionLabel: "View Member Details →",
  });

  return sendEmail({
    to: recipient,
    subject,
    html,
    templateKey: "ADMIN_ALERT_UPGRADE",
    metadata: {
      userId,
      tier,
      amountTotal,
      stripeSessionId,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PURCHASE NOTIFICATION (Courses, Toolkits, Bundles, Marketplace, Seats, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export interface AdminPurchaseNotificationParams {
  userId: string;
  itemType: string;
  itemName: string;
  amountTotal?: number | null;
  currency?: string | null;
  stripeSessionId?: string | null;
  metadata?: Record<string, any> | null;
  customerEmail?: string | null;
  customerName?: string | null;
}

export async function notifyAdminPurchase({
  userId,
  itemType,
  itemName,
  amountTotal,
  currency = "usd",
  stripeSessionId,
  metadata,
  customerEmail,
  customerName,
}: AdminPurchaseNotificationParams): Promise<{ success: boolean }> {
  const recipient = ADMIN_NOTIFICATION_EMAIL;

  // Deduplication check: check if already notified for this stripe session in last hour
  if (stripeSessionId) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await prisma.emailLog.findFirst({
        where: {
          recipient,
          templateKey: "ADMIN_ALERT_PURCHASE",
          subject: { contains: stripeSessionId.slice(-8) },
          createdAt: { gte: oneHourAgo },
        },
      });
      if (existing) {
        return { success: true };
      }
    } catch (err) {
      console.warn("[Admin Notification] Check error:", err);
    }
  }

  // Fetch buyer details from DB
  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    })
    .catch(() => null);

  const email = user?.email || customerEmail || "Unknown Email";
  const name = user?.name || customerName || "Customer";
  const formattedAmount = amountTotal ? formatMoney(amountTotal, currency || "usd") : "Paid Order";

  const typeLabels: Record<string, string> = {
    course: "Academy Course",
    toolkit: "Professional Toolkit",
    bundle: "Toolkit & Training Bundle",
    training_seats: "Staff Training Seats",
    pro_talk_host: "Pro Talk Host Seat",
    marketplace: "Marketplace Product/Service",
    proconnect_card: "ProConnect Digital Card",
    pro_network_sub: "Pro Network Membership",
  };
  const categoryLabel = typeLabels[itemType] || itemType.replaceAll("_", " ");

  const sessionShort = stripeSessionId ? ` (${stripeSessionId.slice(-8)})` : "";
  const subject = `💳 New Purchase: ${itemName} (${formattedAmount}) by ${name}${sessionShort}`;
  const nowFormatted = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }) + " ET";

  const tableRows = [
    { label: "Product / Item", value: `<strong style="color:#ffffff;font-size:15px;">${escapeHtml(itemName)}</strong>` },
    { label: "Category", value: `<span style="color:#7fe0b8;font-weight:700;">${escapeHtml(categoryLabel)}</span>` },
    { label: "Amount Paid", value: `<span style="color:#f3d98b;font-weight:800;font-size:16px;">${escapeHtml(formattedAmount)}</span>` },
    { label: "Buyer Name", value: escapeHtml(name) },
    { label: "Buyer Email", value: `<a href="mailto:${escapeHtml(email)}" style="color:#f3d98b;text-decoration:none;">${escapeHtml(email)}</a>` },
    ...(user?.phone ? [{ label: "Phone", value: escapeHtml(user.phone) }] : []),
    { label: "Purchased At", value: `${escapeHtml(nowFormatted)}` },
    ...(stripeSessionId ? [{ label: "Stripe Session", value: `<code style="font-size:11px;color:#8b9bb4;">${escapeHtml(stripeSessionId)}</code>` }] : []),
  ];

  const html = renderAdminEmailShell({
    badgeText: "New Purchase",
    badgeBg: "#047857",
    badgeColor: "#ecfdf5",
    title: "Order Payment Confirmed",
    subtitle: `${name} has purchased "${itemName}".`,
    tableRows,
    actionUrl: `${SITE_URL}/admin`,
    actionLabel: "View in Admin Console →",
  });

  return sendEmail({
    to: recipient,
    subject,
    html,
    templateKey: "ADMIN_ALERT_PURCHASE",
    metadata: {
      userId,
      itemType,
      itemName,
      amountTotal,
      stripeSessionId,
      metadata,
    },
  });
}
