import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isVisible, buildVCard } from "@/lib/connectCard";

type Params = { params: Promise<{ username: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { username } = await params;

  const card = await prisma.digitalCard.findUnique({
    where: { username: username.toLowerCase() },
    include: { user: { select: { id: true, name: true, image: true, email: true, website: true } } },
  });
  if (!card || !card.isActivated) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const session = await auth.api.getSession({ headers: req.headers });
  const vis = { isOwner: session?.user?.id === card.userId, isLoggedIn: !!session };

  const vcard = buildVCard({
    name: card.user.name,
    title: card.professionalTitle,
    businessName: card.businessName,
    phone:   isVisible(card.phoneVisibility, vis)   ? card.phone : null,
    email:   isVisible(card.emailVisibility, vis)   ? card.user.email : null,
    website: isVisible(card.websiteVisibility, vis) ? card.user.website : null,
    address: isVisible(card.addressVisibility, vis) ? card.businessAddress : null,
  });

  void prisma.digitalCard.update({ where: { id: card.id }, data: { contactSaves: { increment: 1 } } }).catch(() => {});

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${card.user.name.replace(/[^a-z0-9]+/gi, "_")}.vcf"`,
    },
  });
}
