import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureActiveTrainingVersion, generateInviteToken } from "@/lib/trainingServer";

// Invites one staff member into a seat on the caller's training license.
// No transactional email service is wired up yet, so — same pattern as Pro
// Talk invite links — this returns a shareable link for the ERO to send
// themselves (email, text, etc.) rather than sending mail server-side.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolkitId, name, email } = await req.json() as { toolkitId?: string; name?: string; email?: string };
  if (!toolkitId || !name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name, email, and toolkitId are required." }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase();

  const license = await prisma.trainingLicense.findUnique({ where: { eroId_toolkitId: { eroId: session.user.id, toolkitId } } });
  if (!license) return NextResponse.json({ error: "You don't have a training license for this toolkit." }, { status: 404 });

  const existing = await prisma.staffInvitation.findFirst({ where: { licenseId: license.id, email: cleanEmail } });
  if (existing) {
    if (existing.status === "ACCESS_REVOKED") {
      // Re-inviting a previously revoked email — reuse the row instead of hitting the unique constraint.
      const version = await ensureActiveTrainingVersion(toolkitId);
      const reinvited = await prisma.staffInvitation.update({
        where: { id: existing.id },
        data: { status: "INVITED", name: name.trim(), inviteToken: generateInviteToken(), versionId: version.id, revokedAt: null, invitedAt: new Date() },
      });
      return NextResponse.json({ invitation: reinvited, inviteUrl: inviteUrl(reinvited.inviteToken) }, { status: 201 });
    }
    return NextResponse.json({ error: "This email has already been invited." }, { status: 409 });
  }

  const usedSeats = await prisma.staffInvitation.count({ where: { licenseId: license.id, status: { not: "ACCESS_REVOKED" } } });
  if (usedSeats >= license.totalSeats) {
    return NextResponse.json({ error: "No seats available. Purchase more seats to invite additional staff." }, { status: 400 });
  }

  const version = await ensureActiveTrainingVersion(toolkitId);
  const invitation = await prisma.staffInvitation.create({
    data: {
      licenseId: license.id,
      eroId: session.user.id,
      versionId: version.id,
      name: name.trim(),
      email: cleanEmail,
      inviteToken: generateInviteToken(),
      status: "INVITED",
    },
  });

  return NextResponse.json({ invitation, inviteUrl: inviteUrl(invitation.inviteToken) }, { status: 201 });
}

function inviteUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://taxcomppro.com";
  return `${base.replace(/\/$/, "")}/training/accept/${token}`;
}
