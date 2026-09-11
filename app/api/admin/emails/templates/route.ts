import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDefaultEmailTemplates, DEFAULT_EMAIL_TEMPLATES } from "@/lib/email-defaults";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return { session, user };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ensure default templates exist in DB
  await seedDefaultEmailTemplates(prisma);

  const templates = await prisma.emailTemplate.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { logs: true },
      },
    },
  });

  // Attach sample variables to each template response
  const sampleMap = new Map(DEFAULT_EMAIL_TEMPLATES.map((t) => [t.key, t.sampleVariables]));

  const enriched = templates.map((t) => ({
    ...t,
    sampleVariables: sampleMap.get(t.key) || {},
    sentCount: t._count.logs,
  }));

  return NextResponse.json({ templates: enriched });
}
