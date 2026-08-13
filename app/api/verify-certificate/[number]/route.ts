import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToolkit } from "@/lib/toolkits";

type Params = { params: Promise<{ number: string }> };

// Public certificate verification — no auth required, this is the whole
// point of the QR code / verification link printed on the certificate.
export async function GET(_req: NextRequest, { params }: Params) {
  const { number } = await params;

  const cert = await prisma.trainingCertificate.findUnique({
    where: { certificateNumber: number },
    include: { invitation: { include: { license: { select: { officeName: true, toolkitId: true } } } } },
  });

  if (!cert) return NextResponse.json({ valid: false });

  return NextResponse.json({
    valid: true,
    certificateNumber: cert.certificateNumber,
    preparerName: cert.invitation.name,
    officeName: cert.invitation.license.officeName,
    trainingTitle: getToolkit(cert.invitation.license.toolkitId)?.name ?? "Staff Due-Diligence Training",
    versionLabel: cert.versionLabel,
    issuedAt: cert.issuedAt,
    score: cert.score,
  });
}
