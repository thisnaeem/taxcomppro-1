import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isProfessionalTitle } from "@/lib/professionalTitles";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const scalarFields = [
    "name","bio","headline","mission","location",
    "website","linkedIn","twitter","facebook","coverImage","image",
  ] as const;
  const arrayFields = ["specialties","certifications","languages","mediaPhotos"] as const;

  const data: Record<string, unknown> = {};
  if (body.professionalTitle !== undefined) {
    if (body.professionalTitle !== null && body.professionalTitle !== "" && !isProfessionalTitle(body.professionalTitle)) return NextResponse.json({ error: "Choose a valid professional title" }, { status: 400 });
    data.professionalTitle = body.professionalTitle || null;
  }
  for (const f of scalarFields) {
    if (body[f] !== undefined) data[f] = body[f] ?? null;
  }
  for (const f of arrayFields) {
    if (body[f] !== undefined) data[f] = Array.isArray(body[f]) ? body[f] : [];
  }
  if (body.yearsExperience !== undefined) {
    data.yearsExperience = body.yearsExperience !== null && body.yearsExperience !== ""
      ? Number(body.yearsExperience) : null;
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true, professionalTitle: true, name: true, bio: true, headline: true, mission: true,
      location: true, yearsExperience: true, website: true, linkedIn: true,
      twitter: true, facebook: true, specialties: true, certifications: true,
      languages: true, coverImage: true, image: true, mediaPhotos: true,
    },
  });

  return NextResponse.json(updated);
}
