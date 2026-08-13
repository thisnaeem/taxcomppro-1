import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { advanceStatus } from "@/lib/training";

type Params = { params: Promise<{ id: string }> };

// Grades server-side — correct answers never touch the client until after
// grading, and even then only as an explanation/playbook pointer for missed
// questions, never a literal answer-key reveal.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { attemptId, answers } = await req.json() as { attemptId?: string; answers?: number[] };
  if (!attemptId || !Array.isArray(answers)) return NextResponse.json({ error: "attemptId and answers are required" }, { status: 400 });

  const inv = await prisma.staffInvitation.findUnique({ where: { id }, include: { version: true } });
  if (!inv || inv.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.invitationId !== id) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.submittedAt) return NextResponse.json({ error: "This attempt was already submitted." }, { status: 400 });

  const questions = await prisma.trainingQuestion.findMany({ where: { id: { in: attempt.questionIds } } });
  type QuestionRow = (typeof questions)[number];
  const byId = new Map<string, QuestionRow>(questions.map((q: QuestionRow) => [q.id, q]));

  let correct = 0;
  const missed: { question: string; explanation: string }[] = [];
  attempt.questionIds.forEach((qid: string, i: number) => {
    const q = byId.get(qid);
    if (!q) return;
    const given = answers[i];
    if (given === q.correctIndex) correct++;
    else missed.push({ question: q.question, explanation: q.explanation || "Review the applicable playbook section." });
  });

  const score = Math.round((correct / attempt.questionIds.length) * 100);
  const passed = score >= inv.version.passingScore;

  await prisma.assessmentAttempt.update({
    where: { id: attemptId }, data: { answers, score, passed, submittedAt: new Date() },
  });

  const attemptCount = await prisma.assessmentAttempt.count({ where: { invitationId: id } });
  const nextStatus = passed ? advanceStatus(inv.status, "PASSED") : ("FAILED_RETAKE_REQUIRED" as const);

  await prisma.staffInvitation.update({ where: { id }, data: { status: nextStatus } });

  return NextResponse.json({
    score, passed, passingScore: inv.version.passingScore,
    attemptsRemaining: Math.max(0, inv.version.maxAttempts - attemptCount),
    missed: passed ? [] : missed,
  });
}
