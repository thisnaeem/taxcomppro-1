import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/schemas";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const category = searchParams.get("category") ?? "";
  const level    = searchParams.get("level")    ?? "";

  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      ...(search   ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }] } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(level    ? { level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" } : {}),
    },
    include: {
      instructor: { select: { id: true, name: true, image: true, headline: true, role: true } },
      _count:     { select: { enrollments: true, sections: true } },
      sections:   { include: { _count: { select: { lessons: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.course.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const course = await prisma.course.create({
    data: {
      ...parsed.data,
      tags:         parsed.data.tags ?? [],
      thumbnail:    parsed.data.thumbnail || null,
      instructorId: dbUser.id,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
