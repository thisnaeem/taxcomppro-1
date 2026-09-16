import { NextRequest } from "next/server";

type AccessSpace = { id: string; visibility: string; shareToken: string | null; hostId: string; coHostIds: string[] };
export function canAccessSpace(req: NextRequest, space: AccessSpace, user?: { id: string; role?: string | null } | null) {
  return space.visibility === "PUBLIC" || user?.id === space.hostId || user?.role === "ADMIN" ||
    (!!user && space.coHostIds.includes(user.id)) ||
    (!!space.shareToken && req.cookies.get(`pro-talk-invite-${space.id}`)?.value === space.shareToken);
}
