import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateUsername, cardPublicUrl, type Visibility } from "@/lib/connectCard";

const VIS_VALUES = new Set(["PUBLIC", "MEMBERS_ONLY", "PRIVATE"]);
const asVis = (v: unknown, fallback: Visibility): Visibility =>
  typeof v === "string" && VIS_VALUES.has(v) ? (v as Visibility) : fallback;

interface LinkInput { label: string; url: string; icon?: string; color?: string }

// Activates a member's NFC card: creates (or updates) their DigitalCard +
// public Tap Card, in one step, from the /connect activation wizard or the
// dashboard "Connect Card" tab. The member must already have an authenticated
// session — the client creates the account via signUp.email() first so no
// one ever registers twice.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const usernameResult = validateUsername((body.username as string) ?? "");
  if (!usernameResult.ok) return NextResponse.json({ error: usernameResult.error }, { status: 400 });
  const username = usernameResult.value;

  const existing = await prisma.digitalCard.findUnique({ where: { username }, select: { userId: true } });
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const links = Array.isArray(body.links) ? (body.links as LinkInput[]).filter(l => l?.label && l?.url) : null;

  const userPatch: Record<string, unknown> = {};
  for (const f of ["name", "image", "coverImage", "headline", "bio", "location", "website", "linkedIn", "twitter", "facebook"] as const) {
    if (typeof body[f] === "string") userPatch[f] = body[f];
  }
  if (Array.isArray(body.specialties)) userPatch.specialties = body.specialties;

  const card = await prisma.$transaction(async (tx) => {
    if (Object.keys(userPatch).length > 0) {
      await tx.user.update({ where: { id: session.user.id }, data: userPatch });
    }

    const priorCard = await tx.digitalCard.findUnique({ where: { userId: session.user.id } });

    const data = {
      username,
      isActivated: true,
      activatedAt: priorCard?.activatedAt ?? new Date(),
      professionalTitle:   typeof body.professionalTitle === "string" ? body.professionalTitle : undefined,
      businessName:        typeof body.businessName === "string" ? body.businessName : undefined,
      businessDescription: typeof body.businessDescription === "string" ? body.businessDescription : undefined,
      phone:               typeof body.phone === "string" ? body.phone : undefined,
      bookingUrl:          typeof body.bookingUrl === "string" ? body.bookingUrl : undefined,
      businessAddress:     typeof body.businessAddress === "string" ? body.businessAddress : undefined,
      logoUrl:             typeof body.logoUrl === "string" ? body.logoUrl : undefined,
      theme:               typeof body.theme === "string" ? body.theme : undefined,
      accentColor:         typeof body.accentColor === "string" ? body.accentColor : undefined,
      phoneVisibility:     asVis((body.visibility as Record<string, unknown>)?.phone,     "PUBLIC"),
      emailVisibility:     asVis((body.visibility as Record<string, unknown>)?.email,     "PUBLIC"),
      addressVisibility:   asVis((body.visibility as Record<string, unknown>)?.address,   "PRIVATE"),
      bookingVisibility:   asVis((body.visibility as Record<string, unknown>)?.booking,   "PUBLIC"),
      websiteVisibility:   asVis((body.visibility as Record<string, unknown>)?.website,   "PUBLIC"),
      socialVisibility:    asVis((body.visibility as Record<string, unknown>)?.social,    "PUBLIC"),
      servicesVisibility:  asVis((body.visibility as Record<string, unknown>)?.services,  "PUBLIC"),
    };

    const saved = await tx.digitalCard.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });

    if (links) {
      await tx.cardLink.deleteMany({ where: { cardId: saved.id } });
      if (links.length > 0) {
        await tx.cardLink.createMany({
          data: links.map((l, i) => ({
            cardId: saved.id, label: l.label, url: l.url, icon: l.icon ?? null, color: l.color ?? null, order: i,
          })),
        });
      }
    }

    return saved;
  });

  return NextResponse.json({ username: card.username, cardUrl: cardPublicUrl(card.username) });
}
