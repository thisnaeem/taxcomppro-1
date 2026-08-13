import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = session.user as { role?: string };
  return user.role === "ADMIN" ? session : null;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { versionId, question, options, correctIndex, explanation } = await req.json() as {
    versionId?: string; question?: string; options?: string[]; correctIndex?: number; explanation?: string;
  };
  if (!versionId || !question?.trim() || !Array.isArray(options) || options.length < 2 || correctIndex == null) {
    return NextResponse.json({ error: "versionId, question, at least 2 options, and correctIndex are required." }, { status: 400 });
  }

  const count = await prisma.trainingQuestion.count({ where: { versionId } });
  const created = await prisma.trainingQuestion.create({
    data: { versionId, question: question.trim(), options, correctIndex, explanation: explanation ?? null, order: count },
  });
  return NextResponse.json(created, { status: 201 });
}
