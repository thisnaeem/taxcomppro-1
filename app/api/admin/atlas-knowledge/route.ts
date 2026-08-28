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

// GET: List all knowledge base items
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const items = await prisma.atlasKnowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch knowledge items";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Create a new approved knowledge item
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { question, alternatePhrasings = [], approvedAnswer, category = "GENERAL", relatedUrl, membershipRequired, productRequired, active = true } = body;

    if (!question?.trim() || !approvedAnswer?.trim()) {
      return NextResponse.json({ error: "Question and Approved Answer are required" }, { status: 400 });
    }

    const item = await prisma.atlasKnowledgeItem.create({
      data: {
        question: question.trim(),
        alternatePhrasings: Array.isArray(alternatePhrasings) ? alternatePhrasings : [],
        approvedAnswer: approvedAnswer.trim(),
        category,
        relatedUrl: relatedUrl?.trim() || null,
        membershipRequired: membershipRequired?.trim() || null,
        productRequired: productRequired?.trim() || null,
        active,
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create knowledge item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT: Update an existing knowledge item
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, question, alternatePhrasings, approvedAnswer, category, relatedUrl, membershipRequired, productRequired, active } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const updated = await prisma.atlasKnowledgeItem.update({
      where: { id },
      data: {
        ...(question !== undefined && { question: question.trim() }),
        ...(alternatePhrasings !== undefined && { alternatePhrasings }),
        ...(approvedAnswer !== undefined && { approvedAnswer: approvedAnswer.trim() }),
        ...(category !== undefined && { category }),
        ...(relatedUrl !== undefined && { relatedUrl: relatedUrl?.trim() || null }),
        ...(membershipRequired !== undefined && { membershipRequired: membershipRequired?.trim() || null }),
        ...(productRequired !== undefined && { productRequired: productRequired?.trim() || null }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update knowledge item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete a knowledge item
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await prisma.atlasKnowledgeItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete knowledge item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
