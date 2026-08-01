import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateUsername } from "@/lib/connectCard";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("username") ?? "";
  const result = validateUsername(raw);
  if (!result.ok) return NextResponse.json({ available: false, error: result.error });

  const session = await auth.api.getSession({ headers: req.headers });

  const existing = await prisma.digitalCard.findUnique({
    where: { username: result.value },
    select: { userId: true },
  });

  if (existing && existing.userId !== session?.user?.id) {
    return NextResponse.json({ available: false, error: "That username is already taken." });
  }

  return NextResponse.json({ available: true, username: result.value });
}
