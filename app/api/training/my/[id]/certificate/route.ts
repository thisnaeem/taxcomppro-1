import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getToolkit } from "@/lib/toolkits";
import { buildCertificatePdf } from "@/lib/trainingPdf";

type Params = { params: Promise<{ id: string }> };

// Generated on demand (not stored in Cloudinary) — simple and always
// reflects the latest record. Accessible to the preparer who earned it, or
// the ERO who assigned it.
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const inv = await prisma.staffInvitation.findUnique({
    where: { id },
    include: { license: { select: { officeName: true, toolkitId: true } }, version: { select: { versionLabel: true } }, certificate: true },
  });
  if (!inv || (inv.userId !== session.user.id && inv.eroId !== session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!inv.certificate) return NextResponse.json({ error: "Certificate not yet issued." }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taxcomppro.com";
  const verifyUrl = `${appUrl.replace(/\/$/, "")}/verify-certificate/${inv.certificate.certificateNumber}`;

  const pdfBytes = await buildCertificatePdf({
    preparerName: inv.name, officeName: inv.license.officeName,
    trainingTitle: getToolkit(inv.license.toolkitId)?.name ?? "Staff Due-Diligence Training",
    versionLabel: inv.version.versionLabel, completedAt: inv.certificate.issuedAt,
    score: inv.certificate.score, certificateNumber: inv.certificate.certificateNumber, verifyUrl,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="certificate-${inv.certificate.certificateNumber}.pdf"` },
  });
}
