import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return session;
}

// GET: List unanswered questions (Admin only)
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const questions = await prisma.atlasUnansweredQuestion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(questions);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch unanswered questions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Record a new unanswered question / support inquiry (Public / Internal)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, accountEmail, userId, pageUrl, category = "GENERAL", conversationContext, suggestedAnswer } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const item = await prisma.atlasUnansweredQuestion.create({
      data: {
        question: question.trim(),
        accountEmail: accountEmail?.trim() || null,
        userId: userId || null,
        pageUrl: pageUrl?.trim() || null,
        category,
        conversationContext: conversationContext || null,
        suggestedAnswer: suggestedAnswer?.trim() || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to record unanswered question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: Approve and convert an unanswered question into a live Atlas Knowledge Base item (Admin only)
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, approvedAnswer, status = "APPROVED", category, addToKnowledgeBase = true } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const questionRecord = await prisma.atlasUnansweredQuestion.findUnique({
      where: { id },
    });

    if (!questionRecord) {
      return NextResponse.json({ error: "Question record not found" }, { status: 404 });
    }

    // Update the unanswered question status
    const updatedQuestion = await prisma.atlasUnansweredQuestion.update({
      where: { id },
      data: {
        status,
        suggestedAnswer: approvedAnswer || questionRecord.suggestedAnswer,
      },
    });

    // If approved and approvedAnswer provided, insert into approved Atlas Knowledge Base
    if (status === "APPROVED" && approvedAnswer?.trim() && addToKnowledgeBase) {
      await prisma.atlasKnowledgeItem.create({
        data: {
          question: questionRecord.question,
          approvedAnswer: approvedAnswer.trim(),
          category: category || questionRecord.category || "GENERAL",
          active: true,
        },
      });
    }

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to process question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete an unanswered question (Admin only)
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.atlasUnansweredQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
