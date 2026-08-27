import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — current user's own application
// If the user has an APPROVED application but is no longer PROFESSIONAL
// (e.g. admin demoted them), we reset the record so they can reapply.
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, proApplication: true },
  });

  const app = user?.proApplication ?? null;

  // Stale approved record but user is no longer PROFESSIONAL → reset it
  if (app && app.status === "APPROVED" && user?.role !== "PROFESSIONAL") {
    await prisma.professionalApplication.delete({ where: { userId: session.user.id } });
    return NextResponse.json(null);
  }

  return NextResponse.json(app ?? null);
}

// POST — submit application (MEMBER only, one per user)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role === "PROFESSIONAL") return NextResponse.json({ error: "Already a professional" }, { status: 400 });
  if (user?.role === "ADMIN") return NextResponse.json({ error: "Admins cannot apply" }, { status: 400 });

  // Delete any stale/rejected application before creating a new one
  await prisma.professionalApplication.deleteMany({ where: { userId: session.user.id } });

  const body = await req.json();
  const {
    category,
    specialty,
    services,
    credentials,
    yearsExperience,
    businessName,
    website,
    serviceArea,
    serviceModes,
    languages,
    email,
    phone,
    businessAddress,
    reason,
    licenseUrl,
  } = body;

  const combinedSpecialty = [category, specialty].filter(Boolean).join(" · ") || specialty || "Professional";
  const combinedCredentials = [
    credentials,
    yearsExperience ? `${yearsExperience} experience` : null,
    Array.isArray(services) && services.length ? `Services: ${services.join(", ")}` : null,
    serviceArea ? `Area: ${serviceArea} (${Array.isArray(serviceModes) ? serviceModes.join(", ") : "In-Person & Virtual"})` : null,
    languages ? `Languages: ${languages}` : null,
  ].filter(Boolean).join(" | ");

  const combinedReason = [
    reason,
    "",
    "--- Contact & Business Details ---",
    businessName ? `Business Name: ${businessName}` : null,
    email ? `Email: ${email}` : null,
    phone ? `Phone: ${phone}` : null,
    website ? `Website: ${website}` : null,
    businessAddress ? `Address: ${businessAddress}` : null,
    licenseUrl ? `License Document: ${licenseUrl}` : null,
  ].filter(Boolean).join("\n");

  if (!combinedReason.trim() || !combinedSpecialty.trim() || !combinedCredentials.trim()) {
    return NextResponse.json({ error: "All required fields must be completed." }, { status: 400 });
  }

  const app = await prisma.professionalApplication.create({
    data: {
      userId:      session.user.id,
      reason:      combinedReason.trim(),
      specialty:   combinedSpecialty.trim(),
      credentials: combinedCredentials.trim(),
    },
  });

  // Optionally update user's profile with provided details
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(website ? { website: website.trim() } : {}),
      ...(serviceArea ? { location: serviceArea.trim() } : {}),
    },
  }).catch(() => {});

  return NextResponse.json(app, { status: 201 });
}
