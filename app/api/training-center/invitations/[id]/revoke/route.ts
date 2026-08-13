import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// Revoke (and free up) a seat before training is completed. Once a preparer
// has finished training and received a certificate, that seat is considered
// used for the training year and can no longer be revoked/reassigned.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const inv = await prisma.staffInvitation.findUnique({ where: { id } });
  if (!inv || inv.eroId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status === "TRAINING_COMPLETED") {
    return NextResponse.json({ error: "This seat is already used for this training year and can't be revoked." }, { status: 400 });
  }

  const updated = await prisma.staffInvitation.update({
    where: { id }, data: { status: "ACCESS_REVOKED", revokedAt: new Date() },
  });
  return NextResponse.json(updated);
}
