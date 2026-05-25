import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const pro = await prisma.user.findUnique({
    where: { id, role: "PROFESSIONAL" },
    select: {
      id: true, name: true, image: true, coverImage: true, headline: true, bio: true,
      mission: true, location: true, yearsExperience: true,
      website: true, linkedIn: true, twitter: true, facebook: true,
      specialties: true, certifications: true, languages: true,
      mediaPhotos: true, voiceMemoUrl: true, createdAt: true,
      instructorCourses: {
        where: { status: "PUBLISHED" },
        select: { id: true, slug: true, title: true, thumbnail: true, level: true, price: true, isFree: true },
        take: 4,
      },
    },
  });

  if (!pro) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pro);
}
