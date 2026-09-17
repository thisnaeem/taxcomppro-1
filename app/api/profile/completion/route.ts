import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureProfileSlug } from "@/lib/profileSlug";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, professionalTitle: true, profileSlug: true,
      headline: true, bio: true, mission: true, location: true, yearsExperience: true,
      image: true, coverImage: true, specialties: true, certifications: true,
      languages: true, mediaPhotos: true, voiceMemoUrl: true, website: true,
      linkedIn: true, twitter: true, facebook: true,
    },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const profileSlug = profile.profileSlug || await ensureProfileSlug(profile.id, profile.name);
  return NextResponse.json({ ...profile, profileSlug }, { headers: { "Cache-Control": "private, no-store" } });
}
