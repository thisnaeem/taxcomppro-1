import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: accept or decline a connection
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json(); // "accept" | "decline"

  if (action !== "accept" && action !== "decline") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const connection = await prisma.connection.findUnique({ where: { id } });
  if (!connection || connection.receiverId !== session.user.id || connection.status !== "PENDING") {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
  }

  const status = action === "accept" ? "ACCEPTED" : "REJECTED";
  const updated = await prisma.connection.update({ where: { id }, data: { status } });

  if (status === "ACCEPTED") {
    await prisma.notification.create({
      data: {
        userId:  connection.requesterId,
        type:    "CONNECTION_ACCEPTED",
        title:   "Connection Accepted",
        message: `${session.user.name} accepted your connection request`,
        link:    "/connections",
      },
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}

// DELETE: remove connection
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const connection = await prisma.connection.findUnique({ where: { id } });
  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (connection.requesterId !== session.user.id && connection.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.connection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
