/**
 * Shared email design system for Tax Compliance Pro.
 *
 * Every transactional email is composed from these primitives so branding, spacing,
 * dark mode and Outlook fallbacks stay consistent in one place.
 *
 * Email-client constraints honoured here:
 *  - Table-based layout only. No flexbox, no float, no CSS grid (Outlook/Gmail drop them).
 *  - Critical styling is inlined on the element; <style> carries only media queries and
 *    dark-mode overrides, which Gmail may strip without breaking the layout.
 *  - Buttons use a VML fallback so they render as real buttons in Outlook for Windows.
 *  - All interpolated user content is escaped (see escapeHtml).
 */

export const BRAND = {
  navy: "#0a1628",
  navyMid: "#16305c",
  gold: "#ffbe24",
  goldLight: "#ffbe24",
  heading: "#0f172a",
  body: "#475569",
  muted: "#94a3b8",
  border: "#e2e8f0",
  surface: "#ffffff",
  page: "#eef2f7",
  logo: "https://taxcomppro.com/logo_dark.webp",
  site: "https://taxcomppro.com",
  supportEmail: "support@taxcomppro.com",
  tagline: "#1 TAX PREPARER AUDIT PROTECTION",
} as const;

/** Escapes untrusted content before it is interpolated into email HTML. */
export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escapes a URL for an href attribute, rejecting non-http(s) schemes. */
export function safeUrl(url: string): string {
  const trimmed = String(url ?? "").trim();
  if (!/^https?:\/\//i.test(trimmed)) return BRAND.site;
  return escapeHtml(trimmed);
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO_STACK = "'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/**
 * A bulletproof CTA button. Renders as a rounded gold pill everywhere, with a
 * VML rectangle so Outlook for Windows shows a real button rather than a bare link.
 */
export function renderButton({ href, label }: { href: string; label: string }): string {
  const url = safeUrl(href);
  const text = escapeHtml(label);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto;">
  <tr>
    <td align="center" style="border-radius:999px;background-color:${BRAND.gold};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${url}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="50%"
        stroke="f" fillcolor="${BRAND.gold}">
        <w:anchorlock/>
        <center style="color:${BRAND.navy};font-family:${FONT_STACK};font-size:15px;font-weight:bold;">${text}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${url}" target="_blank" rel="noopener noreferrer"
        style="display:inline-block;padding:15px 38px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:${BRAND.navy};text-decoration:none;border-radius:999px;background-color:${BRAND.gold};letter-spacing:0.2px;">${text}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`.trim();
}

/** A neutral inset panel used for ticket details, plan summaries and notices. */
export function renderPanel(innerHtml: string, accent = false): string {
  const borderLeft = accent ? `border-left:4px solid ${BRAND.gold};` : "";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="panel"
  style="background-color:#f8fafc;border:1px solid ${BRAND.border};${borderLeft}border-radius:12px;margin:0 0 24px 0;">
  <tr><td style="padding:20px;">${innerHtml}</td></tr>
</table>`.trim();
}

/** A label/value row. Uses a table, not flexbox, so it survives Outlook and Gmail. */
export function renderRow(label: string, valueHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tr>
    <td align="left" style="font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${BRAND.muted};padding-right:12px;white-space:nowrap;" class="dark-muted">${escapeHtml(label)}</td>
    <td align="right" style="font-family:${FONT_STACK};font-size:13px;font-weight:700;color:${BRAND.heading};" class="dark-heading">${valueHtml}</td>
  </tr>
</table>`.trim();
}

/** A pill badge. `tone` picks the colour set. */
export function renderBadge(label: string, tone: "info" | "success" | "warning" = "info"): string {
  const tones = {
    info: { bg: "#eff6ff", fg: "#1d4ed8" },
    success: { bg: "#dcfce7", fg: "#15803d" },
    warning: { bg: "#fef3c7", fg: "#b45309" },
  } as const;
  const t = tones[tone];
  return `<span style="display:inline-block;background-color:${t.bg};color:${t.fg};font-family:${FONT_STACK};font-weight:700;font-size:11px;letter-spacing:0.5px;padding:4px 12px;border-radius:999px;">${escapeHtml(label)}</span>`;
}

/** Body paragraph with the standard measure and rhythm. */
export function renderText(html: string, size = 15): string {
  return `<p style="font-family:${FONT_STACK};font-size:${size}px;line-height:1.65;color:${BRAND.body};margin:0 0 20px 0;" class="dark-body">${html}</p>`;
}

export interface EmailShellOptions {
  /** Hidden inbox preview line. Shown next to the subject in most clients. */
  preheader: string;
  /** The h1 inside the card. */
  heading: string;
  /** Pre-rendered body HTML built from the primitives above. */
  body: string;
  /** Optional extra line above the copyright. */
  footerNote?: string;
}

/**
 * Wraps body content in the branded shell: navy masthead, white card, footer.
 * Supports light and dark inboxes via prefers-color-scheme.
 */
export function renderEmailShell({
  preheader,
  heading,
  body,
  footerNote,
}: EmailShellOptions): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(heading)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    body { margin:0 !important; padding:0 !important; width:100% !important; }
    a { color:${BRAND.gold}; }

    @media only screen and (max-width:600px) {
      .card       { width:100% !important; border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
      .pad        { padding-left:22px !important; padding-right:22px !important; }
      .otp-code   { font-size:32px !important; letter-spacing:8px !important; }
      .stack      { display:block !important; width:100% !important; text-align:left !important; }
    }

    @media (prefers-color-scheme: dark) {
      .page        { background-color:#0b1220 !important; }
      .card        { background-color:#131c2e !important; border-color:#24324a !important; }
      .panel       { background-color:#1a2438 !important; border-color:#2b3a54 !important; }
      .dark-heading{ color:#f1f5f9 !important; }
      .dark-body   { color:#cbd5e1 !important; }
      .dark-muted  { color:#94a3b8 !important; }
      .footer      { background-color:#0e1626 !important; border-color:#24324a !important; }
      .code-box    { background-color:#0b1220 !important; border-color:#3a4b6b !important; }
      .code-digits { color:#ffffff !important; }
      /* Inset white boxes (quoted messages) must darken too, or light text
         lands on a still-white background and disappears. */
      .dark-surface{ background-color:#0b1220 !important; border-color:#2b3a54 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};">
  <!-- Inbox preview text, hidden in the rendered email -->
  <div style="display:none;font-size:1px;color:${BRAND.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:${BRAND.page};width:100%;">
    <tr>
      <td align="center" style="padding:40px 12px;">

        <table role="presentation" class="card" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:600px;max-width:600px;background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">

          <!-- Masthead -->
          <tr>
            <td align="center"
              style="background-color:${BRAND.navy};background-image:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyMid} 100%);padding:34px 30px 30px 30px;">
              <a href="${BRAND.site}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img src="${BRAND.logo}" alt="Tax Compliance Pro" width="168"
                  style="display:block;margin:0 auto 14px auto;width:168px;max-width:168px;height:auto;border:0;" />
              </a>
              <div style="font-family:${FONT_STACK};color:${BRAND.goldLight};font-size:10px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;">
                ${BRAND.tagline}
              </div>
            </td>
          </tr>

          <!-- Gold hairline under the masthead -->
          <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${BRAND.gold};">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td class="pad" style="padding:38px 36px 30px 36px;">
              <h1 style="font-family:${FONT_STACK};font-size:21px;line-height:1.35;font-weight:800;color:${BRAND.heading};margin:0 0 18px 0;" class="dark-heading">${escapeHtml(heading)}</h1>
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="pad footer" align="center"
              style="background-color:#f8fafc;border-top:1px solid ${BRAND.border};padding:24px 36px 28px 36px;">
              ${
                footerNote
                  ? `<p style="font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${BRAND.muted};margin:0 0 8px 0;" class="dark-muted">${footerNote}</p>`
                  : ""
              }
              <p style="font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${BRAND.muted};margin:0 0 6px 0;" class="dark-muted">
                Questions? Reach us at
                <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.gold};text-decoration:none;font-weight:600;">${BRAND.supportEmail}</a>
              </p>
              <p style="font-family:${FONT_STACK};font-size:11px;line-height:1.6;color:${BRAND.muted};margin:0;" class="dark-muted">
                &copy; ${new Date().getFullYear()} Tax Compliance Pro. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * The one-time-code block. The code is the hero of the verification email, so it
 * gets its own high-contrast panel with wide letter spacing for easy transcription.
 */
export function renderOtpCode(code: string): string {
  const digits = escapeHtml(code);
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
  <tr>
    <td align="center" class="code-box"
      style="background-color:#f8fafc;border:2px dashed ${BRAND.gold};border-radius:14px;padding:24px 16px;">
      <div style="font-family:${FONT_STACK};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND.muted};margin-bottom:12px;" class="dark-muted">
        Your verification code
      </div>
      <div class="otp-code code-digits"
        style="font-family:${MONO_STACK};font-size:40px;font-weight:700;letter-spacing:12px;color:${BRAND.navy};line-height:1.1;text-indent:12px;">
        ${digits}
      </div>
    </td>
  </tr>
</table>`.trim();
}

export { FONT_STACK, MONO_STACK };
