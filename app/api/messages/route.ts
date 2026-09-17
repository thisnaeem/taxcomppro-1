import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: conversation threads (latest message per partner)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get last message for each unique conversation partner
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender:   { select: { id: true, profileSlug: true, name: true, image: true, headline: true } },
      receiver: { select: { id: true, profileSlug: true, name: true, image: true, headline: true } },
    },
  });

  // Deduplicate by partner ID — keep only the latest message per thread
  const unread = new Map<string, number>();
  for (const message of messages) {
    if (message.receiverId === userId && !message.isRead) unread.set(message.senderId, (unread.get(message.senderId) || 0) + 1);
  }
  const seen  = new Set<string>();
  const threads = messages.filter(m => {
    const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
    if (seen.has(partnerId)) return false;
    seen.add(partnerId);
    return true;
  }).map(m => {
    const partner = m.senderId === userId ? m.receiver : m.sender;
    return { ...m, partner, unreadCount: unread.get(partner.id) || 0 };
  });

  return NextResponse.json(threads);
}
