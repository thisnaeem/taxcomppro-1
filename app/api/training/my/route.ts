import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getToolkit } from "@/lib/toolkits";
import { STATUS_LABELS } from "@/lib/training";

// All training assigned to the caller (as a preparer). A preparer only ever
// sees their own assignments here — never the ERO's purchases, billing, or
// other staff members.
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invitations = await prisma.staffInvitation.findMany({
    where: { userId: session.user.id, status: { not: "ACCESS_REVOKED" } },
    orderBy: { invitedAt: "desc" },
    include: {
      license: { select: { toolkitId: true, officeName: true } },
      version: { select: { versionLabel: true, videoDurationSeconds: true } },
      attempts: { orderBy: { attemptNumber: "desc" }, take: 1 },
      acknowledgment: { select: { signedAt: true } },
      certificate: { select: { certificateNumber: true } },
    },
  });

  return NextResponse.json(invitations.map((inv: (typeof invitations)[number]) => ({
    id: inv.id,
    toolkitName: getToolkit(inv.license.toolkitId)?.name ?? inv.license.toolkitId,
    officeName: inv.license.officeName,
    versionLabel: inv.version.versionLabel,
    status: inv.status,
    statusLabel: STATUS_LABELS[inv.status] ?? inv.status,
    videoFurthestSeconds: inv.videoFurthestSeconds,
    videoDurationSeconds: inv.version.videoDurationSeconds,
    videoCompletedAt: inv.videoCompletedAt,
    latestAttempt: inv.attempts[0] ? { score: inv.attempts[0].score, passed: inv.attempts[0].passed, attemptNumber: inv.attempts[0].attemptNumber } : null,
    acknowledgedAt: inv.acknowledgment?.signedAt ?? null,
    certificateNumber: inv.certificate?.certificateNumber ?? null,
  })));
}
