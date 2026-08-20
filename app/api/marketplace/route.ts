import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search   = searchParams.get("search");

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      status: "APPROVED",
      ...(category && category !== "ALL" ? { category: category as "SERVICE" | "PRODUCT" | "NETWORK" | "TRAINING" } : {}),
      ...(search ? { OR: [
        { title:       { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]} : {}),
    },
    include: {
      user: { select: { id: true, name: true, image: true, headline: true, role: true, tier: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const isAdmin = user?.role === "ADMIN";
  const canSell = isAdmin || user?.tier === "MARKETPLACE" || user?.tier === "MARKETPLACE_PLUS" || user?.role === "PROFESSIONAL";

  if (!canSell) {
    return NextResponse.json({ error: "Upgrade to Marketplace tier to create listings" }, { status: 403 });
  }

  const body = await req.json();

  // Generate URL-safe slug from title
  const baseSlug = (body.title as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  // Ensure uniqueness by appending a short random suffix if collision
  let slug = baseSlug;
  const existing = await prisma.marketplaceListing.findUnique({ where: { slug } });
  if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const listing = await prisma.marketplaceListing.create({
    data: {
      slug,
      title:       body.title,
      description: body.description,
      category:    body.category,
      price:       body.price ?? null,
      tags:        body.tags ?? [],
      images:      body.images ?? [],
      metadata:    body.metadata ?? undefined,
      userId:      session.user.id,
      status:      "APPROVED",
      isFeatured:  isAdmin,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
