import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { advanceStatus } from "@/lib/training";

type Params = { params: Promise<{ token: string }> };

// Links the caller's (just-created or existing) individual account to a
// staff invitation. Called right after signUp.email() during accept, or
// right after logging in if the preparer already had a TaxCompPro account.
// Each preparer gets their own account — this never creates a shared login.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await params;

  const inv = await prisma.staffInvitation.findUnique({ where: { inviteToken: token } });
  if (!inv) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (inv.status === "ACCESS_REVOKED") return NextResponse.json({ error: "This invitation has been revoked." }, { status: 410 });
  if (inv.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "This invitation was sent to a different email address." }, { status: 403 });
  }
  if (inv.userId && inv.userId !== session.user.id) {
    return NextResponse.json({ error: "This invitation has already been claimed." }, { status: 409 });
  }

  const updated = await prisma.staffInvitation.update({
    where: { id: inv.id },
    data: { userId: session.user.id, registeredAt: inv.registeredAt ?? new Date(), status: advanceStatus(inv.status, "REGISTERED") },
  });
  return NextResponse.json(updated);
}
