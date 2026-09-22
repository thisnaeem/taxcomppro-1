import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, reason } = body;

  if (!email || !String(email).includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    await prisma.newsletterUnsubscribe.upsert({
      where: { email: normalizedEmail },
      update: {
        reason: reason?.trim() || "User requested unsubscribe",
      },
      create: {
        email: normalizedEmail,
        reason: reason?.trim() || "User requested unsubscribe",
      },
    });

    return NextResponse.json({
      success: true,
      message: `You have successfully unsubscribed from marketing and promotional emails.`,
    });
  } catch (err) {
    console.error("[Unsubscribe API] Error:", err);
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 });
  }
}
