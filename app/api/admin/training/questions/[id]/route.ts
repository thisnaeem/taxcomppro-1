import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = session.user as { role?: string };
  return user.role === "ADMIN" ? session : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.question === "string") data.question = body.question;
  if (Array.isArray(body.options)) data.options = body.options;
  if (typeof body.correctIndex === "number") data.correctIndex = body.correctIndex;
  if (typeof body.explanation === "string" || body.explanation === null) data.explanation = body.explanation;
  if (typeof body.order === "number") data.order = body.order;

  const updated = await prisma.trainingQuestion.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.trainingQuestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
