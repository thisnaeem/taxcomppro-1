import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getToolkit } from "@/lib/toolkits";
import { STATUS_LABELS } from "@/lib/training";

// ERO Training Center overview: every training license the caller holds as
// an ERO, with seat usage and per-staff-member status.
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const licenses = await prisma.trainingLicense.findMany({
    where: { eroId: session.user.id },
    orderBy: { purchasedAt: "desc" },
    include: {
      invitations: {
        orderBy: { invitedAt: "desc" },
        include: {
          version: { select: { versionLabel: true, videoDurationSeconds: true } },
          attempts: { orderBy: { attemptNumber: "desc" }, take: 1 },
          acknowledgment: { select: { signedAt: true } },
          certificate: { select: { certificateNumber: true, issuedAt: true, pdfUrl: true } },
        },
      },
    },
  });

  type LicenseRow = (typeof licenses)[number];
  type InvitationRow = LicenseRow["invitations"][number];

  const payload = licenses.map((lic: LicenseRow) => {
    const usedSeats = lic.invitations.filter((i: InvitationRow) => i.status !== "ACCESS_REVOKED").length;
    return {
      id: lic.id,
      toolkitId: lic.toolkitId,
      toolkitName: getToolkit(lic.toolkitId)?.name ?? lic.toolkitId,
      officeName: lic.officeName,
      totalSeats: lic.totalSeats,
      usedSeats,
      availableSeats: Math.max(0, lic.totalSeats - usedSeats),
      purchasedAt: lic.purchasedAt,
      expiresAt: lic.expiresAt,
      staff: lic.invitations.map((inv: InvitationRow) => ({
        id: inv.id,
        name: inv.name,
        email: inv.email,
        status: inv.status,
        statusLabel: STATUS_LABELS[inv.status] ?? inv.status,
        versionLabel: inv.version.versionLabel,
        invitedAt: inv.invitedAt,
        registeredAt: inv.registeredAt,
        trainingStartedAt: inv.trainingStartedAt,
        videoFurthestSeconds: inv.videoFurthestSeconds,
        videoDurationSeconds: inv.version.videoDurationSeconds,
        videoCompletedAt: inv.videoCompletedAt,
        latestAttempt: inv.attempts[0] ? { score: inv.attempts[0].score, attemptNumber: inv.attempts[0].attemptNumber, passed: inv.attempts[0].passed } : null,
        acknowledgedAt: inv.acknowledgment?.signedAt ?? null,
        certificate: inv.certificate ? { number: inv.certificate.certificateNumber, issuedAt: inv.certificate.issuedAt, pdfUrl: inv.certificate.pdfUrl } : null,
        revocable: inv.status !== "TRAINING_COMPLETED" && inv.status !== "ACCESS_REVOKED",
      })),
    };
  });

  return NextResponse.json({ licenses: payload });
}

// Update the office name shown on the dashboard, certificates, and compliance report.
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { licenseId, officeName } = await req.json() as { licenseId?: string; officeName?: string };
  if (!licenseId) return NextResponse.json({ error: "licenseId required" }, { status: 400 });

  const license = await prisma.trainingLicense.findUnique({ where: { id: licenseId } });
  if (!license || license.eroId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.trainingLicense.update({ where: { id: licenseId }, data: { officeName: officeName?.trim() || null } });
  return NextResponse.json(updated);
}
