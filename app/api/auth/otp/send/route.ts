import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOtp, normalizeEmail, OTP_TTL_MINUTES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().trim().min(1).max(120).optional(),
});

// Coarse per-IP throttle so one host cannot enumerate addresses or burn the mail quota.
// Per-address throttling is handled by the resend cooldown in lib/otp.
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX_SENDS = 15;
const ipHits = new Map<string, number[]>();

function ipThrottled(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (hits.length >= IP_MAX_SENDS) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (ipHits.size > 5000) {
    for (const [key, times] of ipHits) {
      if (times.every((t) => now - t >= IP_WINDOW_MS)) ipHits.delete(key);
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (ipThrottled(ip)) {
    return NextResponse.json(
      { error: "Too many verification requests. Please try again later." },
      { status: 429 }
    );
  }

  const email = normalizeEmail(parsed.data.email);

  // An address that already has an account should go to sign-in, not get a new code.
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in instead.", code: "email_taken" },
      { status: 409 }
    );
  }

  const result = await createOtp(email);
  if (!result.ok || !result.code) {
    return NextResponse.json(
      { error: `Please wait ${result.retryAfter ?? 60} seconds before requesting another code.`, retryAfter: result.retryAfter },
      { status: 429 }
    );
  }

  try {
    await sendOtpEmail({
      to: email,
      code: result.code,
      userName: parsed.data.name,
      expiresInMinutes: OTP_TTL_MINUTES,
    });
  } catch (err) {
    console.error("[OTP] Failed to send verification email:", err);
    return NextResponse.json(
      { error: "We could not send the verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, expiresInMinutes: OTP_TTL_MINUTES });
}
