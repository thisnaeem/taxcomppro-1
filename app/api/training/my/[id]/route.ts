import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getToolkit } from "@/lib/toolkits";
import { STATUS_LABELS } from "@/lib/training";

type Params = { params: Promise<{ id: string }> };

async function ownInvitation(id: string, userId: string) {
  const inv = await prisma.staffInvitation.findUnique({
    where: { id },
    include: {
      license: { select: { toolkitId: true, officeName: true } },
      version: true,
      attempts: { orderBy: { attemptNumber: "asc" } },
      acknowledgment: true,
      certificate: true,
    },
  });
  if (!inv || inv.userId !== userId) return null;
  return inv;
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const inv = await ownInvitation(id, session.user.id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: inv.id,
    toolkitName: getToolkit(inv.license.toolkitId)?.name ?? inv.license.toolkitId,
    officeName: inv.license.officeName,
    status: inv.status,
    statusLabel: STATUS_LABELS[inv.status] ?? inv.status,
    version: {
      id: inv.version.id, versionLabel: inv.version.versionLabel, videoProvider: inv.version.videoProvider,
      videoId: inv.version.videoId, videoUrl: inv.version.videoUrl, videoDurationSeconds: inv.version.videoDurationSeconds,
      passingScore: inv.version.passingScore, questionsToShow: inv.version.questionsToShow, maxAttempts: inv.version.maxAttempts,
      acknowledgmentText: inv.version.acknowledgmentText,
    },
    videoFurthestSeconds: inv.videoFurthestSeconds,
    videoCompletedAt: inv.videoCompletedAt,
    attempts: inv.attempts.map((a: (typeof inv.attempts)[number]) => ({ attemptNumber: a.attemptNumber, score: a.score, passed: a.passed, submittedAt: a.submittedAt })),
    acknowledgment: inv.acknowledgment ? { signedAt: inv.acknowledgment.signedAt, signatureName: inv.acknowledgment.signatureName } : null,
    certificate: inv.certificate ? { certificateNumber: inv.certificate.certificateNumber, issuedAt: inv.certificate.issuedAt } : null,
  });
}
