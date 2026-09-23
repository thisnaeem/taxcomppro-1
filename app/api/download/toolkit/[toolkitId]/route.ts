import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOOLKIT_ALIAS_MAP: Record<string, string[]> = {
  "30-day-tax-office": ["30-day-tax-office", "30-day-tax-office-launch", "30-day-launch", "30daylaunch"],
  "due-diligence-course": ["due-diligence-course", "due-diligence", "staff-audit-ready", "staff-audit-ready-due-diligence"],
  "irs-fine-defense": ["irs-fine-defense", "irsfinedefense", "irs-fine-defense-masterclass"],
  "schedule-c-reconstruction": ["schedule-c-reconstruction", "schedule-c", "schedulecrecon"],
  "audit-playbook": ["audit-playbook", "irs-audit-playbook", "auditplaybook", "audit-ready-playbook"],
  "credits-filing-status": ["credits-filing-status", "credits", "credits-filing-status-explained"],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ toolkitId: string }> }
) {
  const { toolkitId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionUser = session.user as { id: string; role?: string };
  const aliases = TOOLKIT_ALIAS_MAP[toolkitId] || [toolkitId];
  const queryKeys = Array.from(
    new Set([
      toolkitId,
      ...aliases,
      ...aliases.map((a) => `toolkit:${a}`),
      ...aliases.map((a) => `bundle:${a}`),
    ])
  );

  if (sessionUser.role !== "ADMIN") {
    const purchase = await prisma.toolkitPurchase.findFirst({
      where: {
        userId: sessionUser.id,
        OR: [
          { toolkitId: { in: queryKeys } },
          { toolkitId: "bundle:ultimate-bundle" },
          { toolkitId: "bundle:ultimate-bundle-plus" },
          { toolkitId: "ultimate-bundle" },
          { toolkitId: "ultimate-bundle-plus" },
        ],
      },
    });

    const license = await prisma.trainingLicense.findFirst({
      where: {
        eroId: sessionUser.id,
        toolkitId: { in: queryKeys },
      },
    });

    if (!purchase && !license) {
      return NextResponse.json({ error: "Not purchased" }, { status: 403 });
    }
  }

  // Find asset matching any alias
  const asset = await prisma.toolkitAsset.findFirst({
    where: {
      toolkitId: { in: [toolkitId, ...aliases] },
    },
  });

  if (!asset) return NextResponse.json({ error: "File not available" }, { status: 404 });

  // Fetch file server-side and stream with correct headers
  const upstream = await fetch(asset.fileUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${asset.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
