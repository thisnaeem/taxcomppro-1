// Keep ownership distinct from professional titles and subscription access.
export function hasNetworkMembership(member: {status: string; expiresAt: Date | null} | null) {
  return !!member && (member.status === "ACTIVE" || (member.status === "CANCELED" && !!member.expiresAt)) &&
    (!member.expiresAt || member.expiresAt > new Date());
}

export function networkAccessWhere(userId: string) {
  return { userId, OR: [
    { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    { status: "CANCELED", expiresAt: { gt: new Date() } },
  ] };
}
