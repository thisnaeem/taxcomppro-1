import { NextRequest, NextResponse } from "next/server";
import { PROFESSIONAL_TITLES } from "@/lib/professionalTitles";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, verifyOtp } from "@/lib/otp";
import { sendWelcomeEmail, notifyAdminNewSignup } from "@/lib/email";

/**
 * Verifies the emailed code and, on success, creates the account server-side.
 *
 * Sign-up is done here rather than on the client so an account cannot exist without a
 * verified address: the code is checked and the user is created in the same request.
 */

const bodySchema = z.object({
  professionalTitle: z.enum(PROFESSIONAL_TITLES).optional(),
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().max(32).optional(),
});

const REASON_MESSAGE: Record<string, string> = {
  invalid: "That code is not correct.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
  not_found: "No active code for this email. Request a new one.",
};

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!parsed.success) {
    // The client renders this under the code field, so only a code problem should
    // be reported verbatim. A name/password/email problem means the earlier step's
    // data is bad, and saying "password too short" beneath the OTP boxes reads as a
    // bug. Send them back to fix it instead.
    const codeIssue = parsed.error.issues.find((i) => i.path[0] === "code");
    return NextResponse.json(
      {
        error:
          codeIssue?.message ??
          "Your account details could not be validated. Go back and check your information.",
        reason: codeIssue ? "invalid" : "bad_details",
      },
      { status: 400 }
    );
  }

  const { code, name, password, phone, professionalTitle } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const result = await verifyOtp(email, code);
  if (!result.ok) {
    const message = REASON_MESSAGE[result.reason ?? "invalid"] ?? "That code is not correct.";
    return NextResponse.json(
      {
        error:
          result.reason === "invalid" && typeof result.attemptsLeft === "number"
            ? `${message} ${result.attemptsLeft} ${result.attemptsLeft === 1 ? "attempt" : "attempts"} left.`
            : message,
        reason: result.reason,
        attemptsLeft: result.attemptsLeft,
      },
      { status: 400 }
    );
  }

  // Guard the race where the address was registered between sending and verifying.
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in instead.", code: "email_taken" },
      { status: 409 }
    );
  }

  let signUpResponse: Response;
  try {
    signUpResponse = (await auth.api.signUpEmail({
      body: { email, password, name, professionalTitle, ...(phone ? { phone } : {}) },
      headers: request.headers,
      asResponse: true,
    })) as Response;
  } catch (err) {
    console.error("[OTP] Sign-up failed after verification:", err);
    return NextResponse.json(
      { error: "We verified your email but could not create the account. Please try again." },
      { status: 500 }
    );
  }

  if (!signUpResponse.ok) {
    const detail = await signUpResponse.clone().text();
    console.error("[OTP] Sign-up rejected after verification:", signUpResponse.status, detail);
    return NextResponse.json(
      { error: "We could not create the account. Please try again." },
      { status: signUpResponse.status }
    );
  }

  // The address is proven, so record it. Never let this block the sign-in response.
  try {
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  } catch (err) {
    console.error("[OTP] Could not set emailVerified flag:", err);
  }

  // Send the official welcome email to the newly verified member
  try {
    await sendWelcomeEmail({ to: email, userName: name });
  } catch (emailErr) {
    console.error("[OTP Verify] Could not send welcome email:", emailErr);
  }

  // Alert admin of the new sign-up
  try {
    const createdUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true, role: true, tier: true, professionalTitle: true },
    });
    if (createdUser) {
      await notifyAdminNewSignup(createdUser);
    }
  } catch (adminErr) {
    console.error("[OTP Verify] Could not send admin signup notification:", adminErr);
  }

  // Returned as-is so better-auth's session Set-Cookie headers reach the browser.
  return signUpResponse;
}
