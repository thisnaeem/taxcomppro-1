import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateUsername, cardPublicUrl, type Visibility } from "@/lib/connectCard";

const VIS_VALUES = new Set(["PUBLIC", "MEMBERS_ONLY", "PRIVATE"]);
const asVis = (v: unknown, fallback: Visibility): Visibility =>
  typeof v === "string" && VIS_VALUES.has(v) ? (v as Visibility) : fallback;

// The member's own Connect Card — read for the "Connect Card" dashboard tab,
// and edit contact info / design / privacy from there.
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.digitalCard.findUnique({
    where: { userId: session.user.id },
    include: { links: { orderBy: { order: "asc" } } },
  });

  if (!card) return NextResponse.json({ card: null, links: [] });

  return NextResponse.json({
    card: { ...card, cardUrl: cardPublicUrl(card.username) },
    links: card.links,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;

  let username: string | undefined;
  if (typeof body.username === "string") {
    const result = validateUsername(body.username);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const clash = await prisma.digitalCard.findUnique({ where: { username: result.value }, select: { userId: true } });
    if (clash && clash.userId !== session.user.id) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    username = result.value;
  }

  const priorCard = await prisma.digitalCard.findUnique({ where: { userId: session.user.id } });
  if (!priorCard && !username) {
    return NextResponse.json({ error: "Choose a username to activate your card." }, { status: 400 });
  }

  const visibility = (body.visibility ?? {}) as Record<string, unknown>;
  const data = {
    ...(username ? { username } : {}),
    ...(!priorCard ? { isActivated: true, activatedAt: new Date() } : {}),
    ...(typeof body.professionalTitle === "string" ? { professionalTitle: body.professionalTitle } : {}),
    ...(typeof body.businessName === "string" ? { businessName: body.businessName } : {}),
    ...(typeof body.businessDescription === "string" ? { businessDescription: body.businessDescription } : {}),
    ...(typeof body.phone === "string" ? { phone: body.phone } : {}),
    ...(typeof body.bookingUrl === "string" ? { bookingUrl: body.bookingUrl } : {}),
    ...(typeof body.businessAddress === "string" ? { businessAddress: body.businessAddress } : {}),
    ...(typeof body.logoUrl === "string" ? { logoUrl: body.logoUrl } : {}),
    ...(typeof body.theme === "string" ? { theme: body.theme } : {}),
    ...(typeof body.accentColor === "string" ? { accentColor: body.accentColor } : {}),
    ...(visibility.phone     !== undefined ? { phoneVisibility:    asVis(visibility.phone, "PUBLIC") } : {}),
    ...(visibility.email     !== undefined ? { emailVisibility:    asVis(visibility.email, "PUBLIC") } : {}),
    ...(visibility.address   !== undefined ? { addressVisibility:  asVis(visibility.address, "PRIVATE") } : {}),
    ...(visibility.booking   !== undefined ? { bookingVisibility:  asVis(visibility.booking, "PUBLIC") } : {}),
    ...(visibility.website   !== undefined ? { websiteVisibility:  asVis(visibility.website, "PUBLIC") } : {}),
    ...(visibility.social    !== undefined ? { socialVisibility:   asVis(visibility.social, "PUBLIC") } : {}),
    ...(visibility.services  !== undefined ? { servicesVisibility: asVis(visibility.services, "PUBLIC") } : {}),
  };

  const card = await prisma.digitalCard.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, username: username!, ...data },
    update: data,
  });

  return NextResponse.json({ card: { ...card, cardUrl: cardPublicUrl(card.username) } });
}
