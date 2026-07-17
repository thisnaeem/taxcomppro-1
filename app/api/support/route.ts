import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return null;
  return session;
}

// GET: List support tickets (Admin sees all; User sees their own)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if admin
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isAdmin = user?.role === "ADMIN";

  try {
    if (isAdmin) {
      // Admin gets all tickets
      const tickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(tickets);
    } else {
      // User gets their own tickets matching ID or email
      const tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { email: session.user.email }
          ]
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(tickets);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error fetching tickets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Create a new support ticket (Public or Logged-in users)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, description } = body;

    if (!name || !email || !subject || !description) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id || null;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        name,
        email,
        subject,
        description,
        status: "OPEN",
      },
    });

    return NextResponse.json(ticket);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error creating ticket";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: Update ticket status and feedback (Admin only)
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, feedback } = body;

    if (!id) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = status;
    }

    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(ticket);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error updating ticket";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
