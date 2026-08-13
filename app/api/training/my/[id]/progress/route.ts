import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { advanceStatus } from "@/lib/training";

type Params = { params: Promise<{ id: string }> };

// Records the furthest legitimate playback position reached (never regresses
// — pausing/leaving and coming back resumes from here). Once at least 90% of
// the video has been watched, marks the video complete and unlocks the
// assessment.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { furthestSeconds } = await req.json() as { furthestSeconds?: number };
  if (typeof furthestSeconds !== "number" || furthestSeconds < 0) {
    return NextResponse.json({ error: "Invalid position" }, { status: 400 });
  }

  const inv = await prisma.staffInvitation.findUnique({ where: { id }, include: { version: true } });
  if (!inv || inv.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status === "ACCESS_REVOKED") return NextResponse.json({ error: "Access revoked" }, { status: 403 });

  const newFurthest = Math.max(inv.videoFurthestSeconds, Math.floor(furthestSeconds));
  const duration = inv.version.videoDurationSeconds;
  const pct = duration > 0 ? newFurthest / duration : 0;
  const videoNowComplete = pct >= 0.9;

  let status = advanceStatus(inv.status, "TRAINING_STARTED");
  if (videoNowComplete) status = advanceStatus(status, "VIDEO_COMPLETED");

  const updated = await prisma.staffInvitation.update({
    where: { id },
    data: {
      videoFurthestSeconds: newFurthest,
      trainingStartedAt: inv.trainingStartedAt ?? new Date(),
      videoCompletedAt: videoNowComplete ? (inv.videoCompletedAt ?? new Date()) : inv.videoCompletedAt,
      status,
    },
  });

  return NextResponse.json({ videoFurthestSeconds: updated.videoFurthestSeconds, status: updated.status, videoComplete: videoNowComplete });
}
