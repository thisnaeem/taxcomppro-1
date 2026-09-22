export type AudienceSegmentKey =
  | "ALL"
  | "VERIFIED"
  | "MEMBERS"
  | "PROS"
  | "TIER_VIP"
  | "TIER_MARKETPLACE"
  | "TIER_FREE"
  | "CUSTOM";

export interface AudienceSegmentDef {
  key: AudienceSegmentKey;
  label: string;
  description: string;
  badgeTone: "info" | "success" | "warning" | "purple";
}

export const AUDIENCE_SEGMENTS: AudienceSegmentDef[] = [
  {
    key: "ALL",
    label: "All Registered Users",
    description: "Every registered member across all subscription tiers and roles.",
    badgeTone: "info",
  },
  {
    key: "VERIFIED",
    label: "Verified Users Only",
    description: "Users who have completed email verification.",
    badgeTone: "success",
  },
  {
    key: "PROS",
    label: "Tax Professionals",
    description: "Approved tax practitioners, enrolled agents, CPAs and specialists.",
    badgeTone: "purple",
  },
  {
    key: "MEMBERS",
    label: "Standard Members",
    description: "All users with standard member access.",
    badgeTone: "info",
  },
  {
    key: "TIER_VIP",
    label: "VIP Tier Members",
    description: "Subscribers on the premium VIP tier.",
    badgeTone: "warning",
  },
  {
    key: "TIER_MARKETPLACE",
    label: "Marketplace & Plus Sellers",
    description: "Users with active Marketplace or Marketplace Plus memberships.",
    badgeTone: "purple",
  },
  {
    key: "TIER_FREE",
    label: "Free Tier Members",
    description: "Active users on the free introductory plan.",
    badgeTone: "info",
  },
  {
    key: "CUSTOM",
    label: "Custom Email List",
    description: "Manually specified comma-separated or line-separated list of emails.",
    badgeTone: "warning",
  },
];

export interface RecipientInfo {
  id?: string;
  email: string;
  name: string;
  role?: string;
  tier?: string;
}

export interface NewsletterPreset {
  id: string;
  name: string;
  description: string;
  subject: string;
  preheader: string;
  heading: string;
  bodyHtml: string;
  buttonLabel?: string;
  buttonUrl?: string;
  footerNote?: string;
}

export const NEWSLETTER_PRESETS: NewsletterPreset[] = [
  {
    id: "tax-digest",
    name: "Tax Practitioner's Monthly Digest",
    description: "Comprehensive monthly newsletter with tax updates, IRS guidance, and practice tips.",
    subject: "Tax Practice Monthly: Audit Defense Updates & IRS Compliance Brief",
    preheader: "Essential tax updates, due diligence reminders, and platform resources for tax professionals.",
    heading: "Monthly Tax & Compliance Briefing",
    bodyHtml: `<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">Dear {{name}},</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;">Welcome to this month's Tax Compliance Pro Briefing. As regulatory standards tighten and audit enforcement accelerates, staying ahead of IRS procedural shifts is paramount for your practice.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 24px;">
  <tr>
    <td style="padding:20px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ffbe24;margin-bottom:6px;">TOP STORY</div>
      <h3 style="margin:0 0 8px;font-size:17px;font-weight:750;color:#0f172a;">Enhanced ERO Due Diligence &amp; Circular 230 Standards</h3>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">The IRS continues to emphasize preparer accountability on refundable credits (EITC, CTC, ACTC). Ensure your office audit binder and documentation checklists are fully up to date with our verified templates.</p>
    </td>
  </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
  <tr>
    <td style="padding-bottom:14px;">
      <strong style="color:#0f172a;font-size:15px;">Key Updates This Month:</strong>
    </td>
  </tr>
  <tr>
    <td>
      <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;color:#475569;">
        <li><strong>Practice Toolkits:</strong> Updated 2026 Audit-Ready Client Interview Worksheets are now live in your workspace.</li>
        <li><strong>Pro Network Masterclasses:</strong> Join our live weekly roundtable with enrolled agents discussing complex client audits.</li>
        <li><strong>AI Tax Assistant:</strong> Get immediate second opinions on nuanced code interpretations directly inside the platform.</li>
      </ul>
    </td>
  </tr>
</table>

<p style="font-size:15px;line-height:1.7;color:#475569;margin:20px 0 6px;">Explore the newest resources and tools added to your portal today:</p>`,
    buttonLabel: "Explore New Tools & Community",
    buttonUrl: "{{siteUrl}}/toolkits",
    footerNote: "You are receiving this communication as a registered professional on Tax Compliance Pro.",
  },
  {
    id: "platform-announcement",
    name: "Platform Announcement & New Features",
    description: "Highlight new tools, workspace upgrades, and marketplace capabilities.",
    subject: "Exciting New Features: Faster Workflows & Upgraded Pro Workspace",
    preheader: "Discover the latest enhancements designed to power your tax practice.",
    heading: "What's New on Tax Compliance Pro",
    bodyHtml: `<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">Hello {{name}},</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;">We're thrilled to announce a major upgrade to your Tax Compliance Pro workspace. Built directly around feedback from practitioners across the country, these new capabilities streamline your daily workflow.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-left:4px solid #ffbe24;border-radius:8px;padding:16px;margin:0 0 24px;">
  <tr>
    <td>
      <strong style="color:#0f172a;font-size:14px;">Highlights of Today's Release:</strong>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#475569;">
        &bull; <strong>Interactive Pro Hub:</strong> Connect and collaborate in real-time with fellow licensed tax preparers.<br/>
        &bull; <strong>Digital Professional Card:</strong> Share your credentials, specialty badges, and client booking link seamlessly.<br/>
        &bull; <strong>Instant Practice Resources:</strong> 1-click downloads for verified due diligence compliance checklists.
      </p>
    </td>
  </tr>
</table>

<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px;">Log in now to experience the upgraded workspace firsthand:</p>`,
    buttonLabel: "Open Your Workspace",
    buttonUrl: "{{siteUrl}}/overview",
    footerNote: "Thank you for being a valued member of the Tax Compliance Pro network.",
  },
  {
    id: "due-diligence-alert",
    name: "Tax Season Audit & Compliance Alert",
    description: "Urgent compliance alert highlighting audit defense procedures and deadlines.",
    subject: "Action Required: Tax Season Due Diligence & Audit Readiness Checklist",
    preheader: "Protect your practice against compliance penalties with this critical checklist.",
    heading: "Important Practice Compliance Notice",
    bodyHtml: `<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">Dear {{name}},</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;">With the IRS intensifying review of return preparer due diligence (Form 8867), maintaining meticulous, contemporaneous client interview records is your strongest line of defense.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:0 0 24px;">
  <tr>
    <td style="padding:18px;">
      <strong style="color:#991b1b;font-size:15px;">Due Diligence Reminder:</strong>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#7f1d1d;">Penalties under IRC &sect;6695(g) apply per failure for each credit claimed without verified written documentation. Review your office interview workflows today.</p>
    </td>
  </tr>
</table>

<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px;">Access our certified Due Diligence &amp; Audit Ready Toolkits now to guarantee 100% compliance across your office:</p>`,
    buttonLabel: "Review Due Diligence Toolkits",
    buttonUrl: "{{siteUrl}}/toolkits",
    footerNote: "This advisory was sent by Tax Compliance Pro Practice Management Support.",
  },
  {
    id: "vip-perks",
    name: "VIP Member Exclusive Benefits",
    description: "Promotional campaign showcasing VIP features, marketplace credits, and priority support.",
    subject: "Exclusive Member Update: Unlock Your VIP Practitioner Benefits",
    preheader: "Take your practice to the next tier with exclusive VIP benefits and marketplace perks.",
    heading: "Maximize Your Practice Potential",
    bodyHtml: `<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">Hi {{name}},</p>
<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 20px;">As a member of Tax Compliance Pro, you have access to industry-leading audit protection resources. Upgrading your account unlocks an entirely new suite of practice multipliers:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 24px;">
  <tr>
    <td style="padding:20px;">
      <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.9;color:#334155;">
        <li><strong>All-Access Toolkits:</strong> Unlimited downloads of premium audit defense bundles and contracts.</li>
        <li><strong>Priority Concierge Support:</strong> Direct routing to senior tax compliance specialists.</li>
        <li><strong>Seller Marketplace Discounts:</strong> Premium placement and fee waivers on the Tax Compliance Pro Marketplace.</li>
        <li><strong>Full AI Specialist Suite:</strong> 24/7 AI research specialists tailored for tax preparation.</li>
      </ul>
    </td>
  </tr>
</table>

<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 16px;">Upgrade your membership today to unlock instant access across the entire platform:</p>`,
    buttonLabel: "View VIP Upgrades & Pricing",
    buttonUrl: "{{siteUrl}}/pricing",
    footerNote: "Exclusive opportunity for Tax Compliance Pro members.",
  },
];

/**
 * Converts rich HTML email markup into clean, readable plain text paragraphs & bullet points.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  let text = html;

  // Handle table highlight panels
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    const clean = match.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `\n\n[HIGHLIGHT: ${clean}]\n\n`;
  });

  // Handle list items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, "\n");

  // Handle bold and emphasis in plain text
  text = text.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<i>(.*?)<\/i>/gi, "*$1*");

  // Handle line breaks & paragraphs
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Unescape HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&bull;/g, "•")
    .replace(/&middot;/g, "·")
    .replace(/&sect;/g, "§")
    .replace(/&nbsp;/g, " ");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Converts clean plain text (with paragraphs & bullets) into professional inline-styled HTML for email clients.
 */
export function plainTextToHtml(plain: string): string {
  if (!plain) return "";
  const paragraphs = plain.split(/\n\s*\n/);
  const htmlParts = paragraphs.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    // Highlight block: [HIGHLIGHT: ...] or [NOTICE: ...]
    if ((trimmed.startsWith("[HIGHLIGHT:") || trimmed.startsWith("[NOTICE:")) && trimmed.endsWith("]")) {
      const content = trimmed.replace(/^\[(HIGHLIGHT|NOTICE):\s*/, "").slice(0, -1).trim();
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-left:4px solid #ffbe24;border-radius:8px;padding:16px;margin:0 0 20px;"><tr><td><p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">${content}</p></td></tr></table>`;
    }

    const lines = trimmed.split("\n");
    const isBulletList = lines.every(
      (l) => l.trim().startsWith("- ") || l.trim().startsWith("• ") || l.trim().startsWith("* ")
    );

    if (isBulletList) {
      const items = lines.map((l) => {
        const itemText = l.trim().replace(/^[-•*]\s*/, "");
        const formatted = itemText.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>');
        return `<li style="margin-bottom:6px;">${formatted}</li>`;
      });
      return `<ul style="margin:0 0 20px;padding-left:22px;font-size:14px;line-height:1.8;color:#475569;">${items.join("")}</ul>`;
    }

    const formattedLines = lines.map((l) =>
      l.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>')
    ).join("<br/>");

    return `<p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 18px;">${formattedLines}</p>`;
  });

  return htmlParts.filter(Boolean).join("\n");
}

