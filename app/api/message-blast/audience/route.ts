import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessProMarketing } from "@/lib/marketingAccess";
import { prisma } from "@/lib/prisma";
import { calcBlastPrice } from "@/lib/blast-pricing";

// GET /api/message-blast/audience?roles=MEMBER,PROFESSIONAL&cities=Dallas&states=TX
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessProMarketing(session.user))
    return NextResponse.json({ error: "Marketplace Plus required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const roles   = searchParams.get("roles")?.split(",").filter(Boolean) ?? [];
  const cities  = searchParams.get("cities")?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  const states  = searchParams.get("states")?.split(",").map(s => s.trim()).filter(Boolean) ?? [];

  const where: Record<string, unknown> = { id: { not: session.user.id } };

  if (roles.length)  where.role     = { in: roles };
  if (cities.length || states.length) {
    // location stored as free text — we do case-insensitive contains matching
    const locationFilters = [
      ...cities.map(c => ({ location: { contains: c, mode: "insensitive" as const } })),
      ...states.map(s => ({ location: { contains: s, mode: "insensitive" as const } })),
    ];
    where.OR = locationFilters;
  }

  const count = await prisma.user.count({ where });
  const price = calcBlastPrice(count);

  return NextResponse.json({ count, price });
}
