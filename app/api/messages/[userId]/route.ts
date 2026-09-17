import { sendCommunityNotificationEmail } from "@/lib/community-email";
import { after, NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: messages between current user and [userId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: partnerId } = await params;
  const myId = session.user.id;

  const before = new URL(req.url).searchParams.get("before");

  // Mark messages from partner as read
  if (!before) await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: myId, isRead: false },
    data:  { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: partnerId },
        { senderId: partnerId, receiverId: myId },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    take: 101,
  });

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, profileSlug: true, name: true, image: true, headline: true, role: true },
  });

  const hasMore = messages.length > 100;
  const page = messages.slice(0, 100).reverse();
  return NextResponse.json({ messages: page, partner, hasMore, nextCursor: page[0]?.id || null });
}

// POST: send message to [userId]
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: receiverId } = await params;
  const { content, fileUrl, fileName, fileType } = await req.json();

  // Must have content OR a file attachment
  if (!content?.trim() && !fileUrl) {
    return NextResponse.json({ error: "Content or file required" }, { status: 400 });
  }

  // Must be connected to message
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, receiverId, status: "ACCEPTED" },
        { requesterId: receiverId, receiverId: session.user.id, status: "ACCEPTED" },
      ],
    },
  });
  if (!connection) return NextResponse.json({ error: "You must be connected to send messages" }, { status: 403 });

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: content?.trim() ?? "",
      fileUrl:  fileUrl  ?? null,
      fileName: fileName ?? null,
      fileType: fileType ?? null,
    },
  });

  after(() => sendCommunityNotificationEmail({ kind: "DIRECT_MESSAGE", recipientId: receiverId, senderId: session.user.id, eventId: message.id }));

  return NextResponse.json(message, { status: 201 });
}

