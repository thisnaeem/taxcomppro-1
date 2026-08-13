import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getToolkit } from "@/lib/toolkits";
import { STATUS_LABELS } from "@/lib/training";
import { buildComplianceReportPdf } from "@/lib/trainingPdf";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const toolkitId = req.nextUrl.searchParams.get("toolkitId");
  const format = req.nextUrl.searchParams.get("format") ?? "pdf";
  if (!toolkitId) return NextResponse.json({ error: "toolkitId required" }, { status: 400 });

  const license = await prisma.trainingLicense.findUnique({
    where: { eroId_toolkitId: { eroId: session.user.id, toolkitId } },
    include: {
      ero: { select: { name: true } },
      invitations: {
        where: { status: { not: "ACCESS_REVOKED" } },
        include: { version: { select: { versionLabel: true, videoDurationSeconds: true } }, attempts: { orderBy: { attemptNumber: "desc" }, take: 1 }, acknowledgment: true, certificate: true },
      },
    },
  });
  if (!license) return NextResponse.json({ error: "No training license found for this toolkit." }, { status: 404 });

  interface ReportRow {
    name: string; email: string; videoPct: number; score: number | null; acknowledged: boolean;
    certificate: boolean; completedAt: Date | null; status: string; versionLabel: string;
  }

  const rows: ReportRow[] = license.invitations.map((inv: (typeof license.invitations)[number]) => {
    const durationSecs = inv.version.videoDurationSeconds;
    const videoPct = durationSecs > 0 ? Math.min(100, Math.round((inv.videoFurthestSeconds / durationSecs) * 100)) : (inv.videoCompletedAt ? 100 : 0);
    return {
      name: inv.name, email: inv.email, videoPct,
      score: inv.attempts[0]?.score ?? null,
      acknowledged: !!inv.acknowledgment,
      certificate: !!inv.certificate,
      completedAt: inv.certificate?.issuedAt ?? null,
      status: STATUS_LABELS[inv.status] ?? inv.status,
      versionLabel: inv.version.versionLabel,
    };
  });

  const toolkitName = getToolkit(toolkitId)?.name ?? toolkitId;
  const completedCount = rows.filter((r: ReportRow) => r.certificate).length;
  const versionLabels: string[] = [...new Set(rows.filter((r: ReportRow) => r.certificate).map((r: ReportRow) => r.versionLabel))];

  if (format === "csv") {
    const header = ["Staff Member", "Email", "Video Completed", "Assessment Score", "Acknowledgment", "Certificate", "Completion Date", "Status"];
    const csvRows = rows.map(r => [
      r.name, r.email, `${r.videoPct}%`, r.score != null ? `${r.score}%` : "", r.acknowledged ? "Signed" : "",
      r.certificate ? "Issued" : "", r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "", r.status,
    ]);
    const csv = [header, ...csvRows].map(r => r.map(csvEscape).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="training-compliance-report.csv"` },
    });
  }

  if (format === "json") {
    return NextResponse.json({
      officeName: license.officeName, eroName: license.ero.name, toolkitName,
      assignedCount: rows.length, completedCount, rows,
    });
  }

  const pdfBytes = await buildComplianceReportPdf({
    officeName: license.officeName, eroName: license.ero.name, trainingTitle: toolkitName,
    versionLabels, assignedCount: rows.length, completedCount, generatedAt: new Date(),
    rows: rows.map(r => ({ ...r, completedAt: r.completedAt ? new Date(r.completedAt) : null })),
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="training-compliance-report.pdf"` },
  });
}

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
