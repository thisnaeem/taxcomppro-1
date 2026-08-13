import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/training";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const inv = await prisma.staffInvitation.findUnique({
    where: { id },
    include: {
      version: true,
      attempts: { orderBy: { attemptNumber: "asc" } },
      acknowledgment: true,
      certificate: true,
    },
  });
  if (!inv || inv.eroId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...inv, statusLabel: STATUS_LABELS[inv.status] ?? inv.status });
}
