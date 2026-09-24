import { NextRequest } from "next/server";

type AccessSpace = {
  id: string;
  visibility: string;
  shareToken: string | null;
  hostId: string;
  coHostIds?: string[];
  attendances?: { userId: string | null }[];
  rsvps?: { userId: string | null }[];
};

export function canAccessSpace(
  req: NextRequest,
  space: AccessSpace,
  user?: { id: string; role?: string | null } | null
) {
  if (space.visibility === "PUBLIC") return true;
  if (!user) {
    return !!space.shareToken && req.cookies.get(`pro-talk-invite-${space.id}`)?.value === space.shareToken;
  }
  if (user.id === space.hostId || user.role === "ADMIN") return true;
  if (Array.isArray(space.coHostIds) && space.coHostIds.includes(user.id)) return true;
  if (space.attendances?.some(a => a.userId === user.id)) return true;
  if (space.rsvps?.some(r => r.userId === user.id)) return true;
  if (!!space.shareToken && req.cookies.get(`pro-talk-invite-${space.id}`)?.value === space.shareToken) return true;
  return false;
}
