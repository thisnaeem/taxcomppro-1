import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { shuffle, advanceStatus } from "@/lib/training";

type Params = { params: Promise<{ id: string }> };

// Starts a new attempt: randomly selects `questionsToShow` of the version's
// question bank, in randomized order. The answer key is never sent to the
// client — only question text and options.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const inv = await prisma.staffInvitation.findUnique({ where: { id }, include: { version: { include: { questions: true } } } });
  if (!inv || inv.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status === "ACCESS_REVOKED") return NextResponse.json({ error: "Access revoked" }, { status: 403 });
  if (!inv.videoCompletedAt) return NextResponse.json({ error: "Watch at least 90% of the training video before taking the assessment." }, { status: 400 });

  const attemptCount = await prisma.assessmentAttempt.count({ where: { invitationId: id } });
  if (attemptCount >= inv.version.maxAttempts) {
    return NextResponse.json({ error: `You've used all ${inv.version.maxAttempts} attempts. Contact your ERO for a retake.` }, { status: 400 });
  }

  type QuestionRow = (typeof inv.version.questions)[number];
  const pool: QuestionRow[] = inv.version.questions;
  const count = Math.min(inv.version.questionsToShow, pool.length);
  const chosen = shuffle<QuestionRow>(pool).slice(0, count);

  const attempt = await prisma.assessmentAttempt.create({
    data: { invitationId: id, attemptNumber: attemptCount + 1, questionIds: chosen.map((q: QuestionRow) => q.id), answers: [], score: 0, passed: false },
  });

  await prisma.staffInvitation.update({ where: { id }, data: { status: advanceStatus(inv.status, "ASSESSMENT_REQUIRED") } });

  return NextResponse.json({
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    attemptsRemaining: inv.version.maxAttempts - (attemptCount + 1),
    passingScore: inv.version.passingScore,
    questions: chosen.map((q: QuestionRow) => ({ id: q.id, question: q.question, options: q.options })),
  });
}
