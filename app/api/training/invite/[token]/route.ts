import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToolkit } from "@/lib/toolkits";

type Params = { params: Promise<{ token: string }> };

// Public — resolves an invite token so the accept page can show who this
// invite is for before any account exists.
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const inv = await prisma.staffInvitation.findUnique({
    where: { inviteToken: token },
    include: {
      license: { select: { officeName: true, toolkitId: true } },
      version: { select: { versionLabel: true } },
      ero: { select: { name: true } },
    },
  });
  if (!inv) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (inv.status === "ACCESS_REVOKED") return NextResponse.json({ error: "This invitation has been revoked." }, { status: 410 });

  return NextResponse.json({
    name: inv.name, email: inv.email, alreadyLinked: !!inv.userId,
    officeName: inv.license.officeName, eroName: inv.ero.name,
    toolkitName: getToolkit(inv.license.toolkitId)?.name ?? inv.license.toolkitId,
    versionLabel: inv.version.versionLabel,
  });
}
