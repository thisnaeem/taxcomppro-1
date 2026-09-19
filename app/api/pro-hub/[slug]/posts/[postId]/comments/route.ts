import {replyInSpace} from "@/lib/specialists/service";
import {detectSensitiveData,PRIVACY_REMINDER} from "@/lib/specialists/catalog";
import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string; postId: string }> };

// POST — add comment or reply
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, slug } = await params;
  const user = session.user as { id: string };
  const { body, parentId } = await req.json();

  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true, forumId:true, forum:{select:{slug:true}} } });
  if (!post || post.forum.slug !== slug) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if(parentId && !await prisma.forumComment.findFirst({where:{id:parentId,postId}}))return NextResponse.json({error:"Invalid parent comment"},{status:400});
  if(detectSensitiveData(body))return NextResponse.json({error:PRIVACY_REMINDER},{status:400});
  const comment = await prisma.forumComment.create({
    data: { body: body.trim(), postId, authorId: user.id, parentId: parentId ?? null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        include: { author: { select: { id: true, name: true, image: true } } },
      },
    },
  });

    after(() => replyInSpace("FORUM",post.forumId,postId,user.id,body,comment.id).catch(() => console.error("AI reply failed; see specialist activity log.")));
  return NextResponse.json(comment, { status: 201 });
}
