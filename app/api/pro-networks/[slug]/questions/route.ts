import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/pro-networks/[slug]/questions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === network.ownerId || session?.user?.role === "ADMIN";

    const where: Record<string, unknown> = {
      networkId: network.id,
    };

    if (!isOwner) {
      // Members only see answered/public questions or their own submitted questions
      if (session?.user?.id) {
        where.OR = [
          { isPublic: true, isAnswered: true },
          { userId: session.user.id },
        ];
      } else {
        where.isPublic = true;
        where.isAnswered = true;
      }
    }

    const questions = await prisma.proNetworkQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ questions, isOwner });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

// POST /api/pro-networks/[slug]/questions - Submit question to Network Owner
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true, allowQuestions: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    if (!network.allowQuestions) {
      return NextResponse.json({ error: "Submitting questions is currently disabled" }, { status: 400 });
    }

    // Verify membership
    const isOwner = session.user.id === network.ownerId;
    if (!isOwner) {
      const member = await prisma.proNetworkMember.findUnique({
        where: {
          networkId_userId: {
            networkId: network.id,
            userId: session.user.id,
          },
        },
      });
      if (!member || member.status !== "ACTIVE") {
        return NextResponse.json({ error: "Must be a network member to submit questions" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { question } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const item = await prisma.proNetworkQuestion.create({
      data: {
        networkId: network.id,
        userId: session.user.id,
        question: question.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ question: item });
  } catch (error) {
    console.error("Failed to submit question:", error);
    return NextResponse.json({ error: "Failed to submit question" }, { status: 500 });
  }
}

// PATCH /api/pro-networks/[slug]/questions - Answer question (Owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });

    if (!network) {
      return NextResponse.json({ error: "Network not found" }, { status: 404 });
    }

    if (network.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only the network owner can answer questions" }, { status: 403 });
    }

    const body = await req.json();
    const { questionId, answer, isPublic } = body;

    if (!questionId || !answer) {
      return NextResponse.json({ error: "Question ID and answer are required" }, { status: 400 });
    }

    const updated = await prisma.proNetworkQuestion.update({
      where: { id: questionId },
      data: {
        answer: answer.trim(),
        isAnswered: true,
        answeredAt: new Date(),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ question: updated });
  } catch (error) {
    console.error("Failed to answer question:", error);
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
  }
}
