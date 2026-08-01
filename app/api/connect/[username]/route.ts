import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isVisible } from "@/lib/connectCard";

type Params = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { username } = await params;
  const src = req.nextUrl.searchParams.get("src"); // "nfc" | "qr" | undefined

  const card = await prisma.digitalCard.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      user: {
        select: {
          id: true, name: true, image: true, headline: true, email: true,
          website: true, linkedIn: true, twitter: true, facebook: true, role: true,
          proServices: { orderBy: { order: "asc" }, select: { id: true, title: true, description: true, price: true, emoji: true } },
        },
      },
      links: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });

  if (!card || !card.isActivated) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const session = await auth.api.getSession({ headers: req.headers });
  const isOwner = session?.user?.id === card.userId;
  const isLoggedIn = !!session;

  // Fire-and-forget analytics counters
  void prisma.digitalCard.update({
    where: { id: card.id },
    data: {
      pageViews: { increment: 1 },
      ...(src === "nfc" ? { nfcTaps: { increment: 1 } } : {}),
      ...(src === "qr" ? { qrScans: { increment: 1 } } : {}),
    },
  }).catch(() => {});

  const now = new Date();
  type CardLinkRow = { id: string; label: string; url: string; icon: string | null; color: string | null; scheduledStart: Date | null; scheduledEnd: Date | null };
  const links = (card.links as CardLinkRow[])
    .filter((l: CardLinkRow) => (!l.scheduledStart || l.scheduledStart <= now) && (!l.scheduledEnd || l.scheduledEnd >= now))
    .map((l: CardLinkRow) => ({ id: l.id, label: l.label, url: l.url, icon: l.icon, color: l.color }));

  const vis = { isOwner, isLoggedIn };

  return NextResponse.json({
    username: card.username,
    isOwner,
    proId: card.userId,
    name: card.user.name,
    image: card.user.image,
    professionalTitle: card.professionalTitle ?? card.user.headline,
    businessName: card.businessName,
    businessDescription: card.businessDescription,
    logoUrl: card.logoUrl,
    theme: card.theme,
    accentColor: card.accentColor,
    role: card.user.role,

    phone:   isVisible(card.phoneVisibility, vis)   ? card.phone : null,
    email:   isVisible(card.emailVisibility, vis)   ? card.user.email : null,
    website: isVisible(card.websiteVisibility, vis) ? card.user.website : null,
    bookingUrl: isVisible(card.bookingVisibility, vis) ? card.bookingUrl : null,
    businessAddress: isVisible(card.addressVisibility, vis) ? card.businessAddress : null,
    social: isVisible(card.socialVisibility, vis)
      ? { linkedIn: card.user.linkedIn, twitter: card.user.twitter, facebook: card.user.facebook }
      : null,
    services: isVisible(card.servicesVisibility, vis) ? card.user.proServices : [],

    links,
  });
}
