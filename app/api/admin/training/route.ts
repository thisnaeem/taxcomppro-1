import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureActiveTrainingVersion } from "@/lib/trainingServer";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = session.user as { role?: string };
  return user.role === "ADMIN" ? session : null;
}

// GET/PATCH the active TrainingVersion for a toolkit (video, pass score, attempts, acknowledgment text).
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const toolkitId = req.nextUrl.searchParams.get("toolkitId") ?? "irs-fine-defense";

  const version = await ensureActiveTrainingVersion(toolkitId);
  const questions = await prisma.trainingQuestion.findMany({ where: { versionId: version.id }, orderBy: { order: "asc" } });
  return NextResponse.json({ version, questions });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, unknown>;
  const { versionId } = body as { versionId?: string };
  if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const f of ["versionLabel", "videoId", "videoUrl", "acknowledgmentText"] as const) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  for (const f of ["videoDurationSeconds", "passingScore", "questionsToShow", "maxAttempts"] as const) {
    if (typeof body[f] === "number") data[f] = body[f];
  }

  const updated = await prisma.trainingVersion.update({ where: { id: versionId }, data });
  return NextResponse.json(updated);
}
