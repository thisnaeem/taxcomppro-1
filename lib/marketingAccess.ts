/** Shared membership access rule for the Pro Marketing page and APIs. */
export function canAccessProMarketing(user: { role?: string | null; tier?: string | null } | null | undefined): boolean {
  return !!user && (user.role === "ADMIN" || user.tier === "MARKETPLACE_PLUS");
}
