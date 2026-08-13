import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ACKNOWLEDGMENT_STATEMENTS } from "@/lib/training";
import { generateCertificateNumber } from "@/lib/trainingServer";

type Params = { params: Promise<{ id: string }> };

// Records the electronic acknowledgment (all statements must be checked +
// a typed signature) and, since this only fires after a passing score,
// immediately issues the completion certificate.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { signatureName, agreedAll } = await req.json() as { signatureName?: string; agreedAll?: boolean };
  if (!signatureName?.trim()) return NextResponse.json({ error: "Type your full legal name to sign." }, { status: 400 });
  if (!agreedAll) return NextResponse.json({ error: "You must check every statement to continue." }, { status: 400 });

  const inv = await prisma.staffInvitation.findUnique({
    where: { id },
    include: { license: { select: { officeName: true } }, version: { select: { versionLabel: true } }, attempts: { orderBy: { attemptNumber: "desc" }, take: 1 } },
  });
  if (!inv || inv.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (inv.status !== "PASSED") return NextResponse.json({ error: "You must pass the assessment before signing the acknowledgment." }, { status: 400 });

  const existing = await prisma.trainingAcknowledgment.findUnique({ where: { invitationId: id } });
  if (existing) return NextResponse.json({ error: "Already acknowledged." }, { status: 400 });

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? null);

  const [ack] = await prisma.$transaction([
    prisma.trainingAcknowledgment.create({
      data: {
        invitationId: id, fullName: signatureName.trim(), email: session.user.email,
        officeName: inv.license.officeName, versionLabel: inv.version.versionLabel,
        statements: ACKNOWLEDGMENT_STATEMENTS, signatureName: signatureName.trim(),
        ipAddress: ip, userAgent: req.headers.get("user-agent"),
      },
    }),
    prisma.trainingCertificate.create({
      data: {
        invitationId: id, certificateNumber: generateCertificateNumber(),
        score: inv.attempts[0]?.score ?? 0, versionLabel: inv.version.versionLabel,
      },
    }),
    prisma.staffInvitation.update({ where: { id }, data: { status: "TRAINING_COMPLETED" } }),
  ]);

  return NextResponse.json({ acknowledgment: ack });
}
