import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, image: true, coverImage: true,
      headline: true, bio: true, mission: true, location: true,
      yearsExperience: true, website: true, linkedIn: true,
      twitter: true, facebook: true, specialties: true,
      certifications: true, languages: true, mediaPhotos: true,
      voiceMemoUrl: true,
      role: true, tier: true, createdAt: true,
      instructorCourses: {
        where: { status: "PUBLISHED" },
        select: { id: true, slug: true, title: true, thumbnail: true, level: true, price: true, isFree: true },
        take: 4,
      },
      listings: {
        where: { status: "APPROVED" },
        select: { id: true, slug: true, title: true, description: true, price: true, category: true, images: true },
        take: 4,
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
