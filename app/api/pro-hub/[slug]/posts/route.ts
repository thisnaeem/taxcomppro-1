import {replyInSpace} from "@/lib/specialists/service";
import {detectSensitiveData,PRIVACY_REMINDER} from "@/lib/specialists/catalog";
import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

// POST — create a new discussion post in this forum
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const user = session.user as { id: string; role?: string };

  const forum = await prisma.forum.findUnique({ where: { slug } });
  if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });

  // isAdminOnly check
  if (forum.isAdminOnly && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin-only forum" }, { status: 403 });
  }

  const { title, body } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  if(detectSensitiveData(body))return NextResponse.json({error:PRIVACY_REMINDER},{status:400});
  const post = await prisma.forumPost.create({
    data: { title: title.trim(), body: body.trim(), forumId: forum.id, authorId: user.id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

    after(() => replyInSpace("FORUM",forum.id,post.id,user.id,body,post.id).catch(() => console.error("AI reply failed; see specialist activity log.")));
  return NextResponse.json(post, { status: 201 });
}
