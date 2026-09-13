import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRO_TALK_CATEGORIES } from "@/lib/proTalks";

// GET /api/spaces/categories — list categories with live/upcoming session counts
export async function GET() {
  try {
    // Get live and upcoming counts grouped by category
    const activeSpaces = await prisma.space.findMany({
      where: {
        OR: [
          { isLive: true },
          { isLive: false, endedAt: null, scheduledAt: { gt: new Date() } },
        ],
      },
      select: { category: true, isLive: true },
    });

    const countsByCategory: Record<string, { live: number; upcoming: number }> = {};
    for (const s of activeSpaces) {
      const cat = s.category || "Open Discussion";
      if (!countsByCategory[cat]) countsByCategory[cat] = { live: 0, upcoming: 0 };
      if (s.isLive) countsByCategory[cat].live++;
      else countsByCategory[cat].upcoming++;
    }

    // Combine standard 19 categories
    const categoriesWithCounts = PRO_TALK_CATEGORIES.map(c => ({
      ...c,
      liveCount: countsByCategory[c.name]?.live || 0,
      upcomingCount: countsByCategory[c.name]?.upcoming || 0,
      totalActive: (countsByCategory[c.name]?.live || 0) + (countsByCategory[c.name]?.upcoming || 0),
    }));

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Fallback to static list if database query encounters issue
    return NextResponse.json(PRO_TALK_CATEGORIES.map(c => ({
      ...c,
      liveCount: 0,
      upcomingCount: 0,
      totalActive: 0,
    })));
  }
}

// POST /api/spaces/categories — admin add or customize a category
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, emoji, slug } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const categorySlug = slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  try {
    const created = await prisma.spaceCategory.upsert({
      where: { slug: categorySlug },
      update: { name: name.trim(), icon: emoji || "🎙️", isActive: true },
      create: { name: name.trim(), slug: categorySlug, icon: emoji || "🎙️", isActive: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("Failed to save category:", err);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}
