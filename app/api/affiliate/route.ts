import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

function generateCode(): string {
  return "ref_" + nanoid(10);
}

async function getOrCreateSettings() {
  let settings = await prisma.affiliateSettings.findFirst();
  if (!settings) {
    settings = await prisma.affiliateSettings.create({
      data: { updatedAt: new Date() },
    });
  }
  return settings;
}

// GET — fetch current user's affiliate profile (or public settings if not logged in)
export async function GET(req: NextRequest) {
  const settings = await getOrCreateSettings();
  if (!settings.programEnabled) {
    return NextResponse.json({ error: "Affiliate program is currently disabled" }, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ profile: null, settings });
  }

  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { referrals: true } } },
  });

  return NextResponse.json({ profile, settings });
}

// POST — activate affiliate / create profile
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getOrCreateSettings();
  if (!settings.programEnabled) {
    return NextResponse.json({ error: "Affiliate program is disabled" }, { status: 403 });
  }

  // Check if already exists
  const existing = await prisma.affiliateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) return NextResponse.json(existing);

  // Generate unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const taken = await prisma.affiliateProfile.findUnique({ where: { code } });
    if (!taken) break;
    code = generateCode();
    attempts++;
  }

  const profile = await prisma.affiliateProfile.create({
    data: { userId: session.user.id, code, updatedAt: new Date() },
  });

  return NextResponse.json(profile, { status: 201 });
}
