export const CONSENT_KEY = "tcp-cookie-consent-v1";
export const CONSENT_EVENT = "tcp-cookie-consent-change";
export type CookieConsent = { version: 1; supportChat: boolean; savedAt: number };
export function readCookieConsent(): CookieConsent | null {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    if (value?.version === 1 && typeof value.supportChat === "boolean" &&
      typeof value.savedAt === "number" && value.savedAt <= Date.now() &&
      Date.now() - value.savedAt < 180 * 86400000) return value;
  } catch { /* Storage can be unavailable in private browser settings. */ }
  return null;
}
