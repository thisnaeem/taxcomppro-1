// Shared helpers for the NFC / Tap Card ("Connect Card") feature.
// Public Tap Card:     /connect/[username]
// Gated full profile:  /pro/[username]  -> resolves to /find-a-pro/[id]
// Activation wizard:   /connect
// Dashboard tab:       Profile page -> "Connect Card" tab (also reachable at /dashboard/connect-card)

export type Visibility = "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";

export const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "PUBLIC",       label: "Public",       hint: "Visible to anyone" },
  { value: "MEMBERS_ONLY", label: "Members Only",  hint: "Visible only to logged-in users" },
  { value: "PRIVATE",      label: "Private",      hint: "Visible only to you" },
];

// Routes reserved at the top level (or that collide with existing app routes)
// can never be chosen as a public card username.
export const RESERVED_USERNAMES = new Set([
  "connect", "pro", "dashboard", "login", "register", "api", "admin", "join",
  "find-a-pro", "marketplace", "profile", "feed", "messages", "notifications",
  "communities", "courses", "my-courses", "my-listings", "seller-dashboard",
  "spaces", "pro-talks", "toolkits", "tools", "upgrade", "security", "privacy",
  "terms", "cookie-policy", "community-guidelines", "about", "contact", "affiliate",
  "apply-professional", "connections", "pro-hub", "pro-marketing", "pros",
  "new", "edit", "settings", "support", "static", "public", "assets",
  "favicon.ico", "null", "undefined", "home", "index", "logout", "app",
]);

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export function validateUsername(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = (raw ?? "").trim().toLowerCase();
  if (value.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
  if (value.length > 30) return { ok: false, error: "Username must be 30 characters or fewer." };
  if (!USERNAME_REGEX.test(value)) {
    return { ok: false, error: "Use lowercase letters, numbers, and hyphens only (can't start or end with a hyphen)." };
  }
  if (RESERVED_USERNAMES.has(value)) return { ok: false, error: "That username is reserved — please choose another." };
  return { ok: true, value };
}

// Field-level visibility check. Owners and admins always see everything.
export function isVisible(visibility: Visibility, opts: { isOwner: boolean; isLoggedIn: boolean }): boolean {
  if (opts.isOwner) return true;
  if (visibility === "PUBLIC") return true;
  if (visibility === "MEMBERS_ONLY") return opts.isLoggedIn;
  return false;
}

export const CARD_THEMES = [
  { value: "classic",  label: "Classic Navy",  bg: "linear-gradient(160deg,#0a1628,#1a3a6b)", text: "#ffffff" },
  { value: "light",    label: "Clean Light",   bg: "linear-gradient(160deg,#f4f6fb,#e8ecf5)",  text: "#0a1628" },
  { value: "gold",     label: "Gold Accent",   bg: "linear-gradient(160deg,#0a1628,#3a2a0a)",  text: "#ffffff" },
  { value: "emerald",  label: "Emerald",       bg: "linear-gradient(160deg,#052e22,#0a4a36)",  text: "#ffffff" },
  { value: "slate",    label: "Slate",         bg: "linear-gradient(160deg,#1e293b,#334155)",  text: "#ffffff" },
] as const;

export function cardPublicUrl(username: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://taxcomppro.com";
  return `${base.replace(/\/$/, "")}/connect/${username}`;
}

export function qrCodeUrl(data: string, size = 320) {
  // No new dependency required — renders a PNG QR code as an <img src>.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export function buildVCard(input: {
  name: string; title?: string | null; businessName?: string | null;
  phone?: string | null; email?: string | null; website?: string | null;
  address?: string | null; photoUrl?: string | null;
}) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${input.name};;;;`,
    `FN:${input.name}`,
  ];
  if (input.title) lines.push(`TITLE:${input.title}`);
  if (input.businessName) lines.push(`ORG:${input.businessName}`);
  if (input.phone) lines.push(`TEL;TYPE=WORK,VOICE:${input.phone}`);
  if (input.email) lines.push(`EMAIL;TYPE=WORK:${input.email}`);
  if (input.website) lines.push(`URL:${input.website}`);
  if (input.address) lines.push(`ADR;TYPE=WORK:;;${input.address.replace(/,/g, "\\,")};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}
