import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "better-auth/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify that caller is ADMIN
  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (caller?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body;

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  // Check target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    const hashedPassword = await hashPassword(password);

    // Find existing credential account or create one
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: targetUser.id,
        providerId: "credential",
      },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: targetUser.id,
          accountId: targetUser.id,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Password for ${targetUser.name || targetUser.email} has been updated successfully.`,
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Internal error resetting password." },
      { status: 500 }
    );
  }
}
