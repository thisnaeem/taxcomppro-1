import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const purchases = await prisma.marketplacePurchase.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            category: true,
            images: true,
            price: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error fetching marketplace purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}
