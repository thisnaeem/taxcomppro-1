import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { answerQuestion } from "@/lib/specialists/service";
import { z } from "zod";
import { createHash } from "node:crypto";
export const maxDuration = 120;
const input = z.object({
  message: z.string().trim().min(1).max(6000),
  specialist: z.string().max(60).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(6000),
      }),
    )
    .max(12)
    .default([]),
});
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return new Response("Please sign in to ask an AI specialist.", {
      status: 401,
    });
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return new Response(
      "Please shorten your message or start a new conversation.",
      { status: 400 },
    );
  const settings = await prisma.atlasSettings.findFirst();
  if (
    settings &&
    (!settings.widgetEnabled ||
      (!settings.allowedTiers.includes(session.user.tier || "FREE") &&
        session.user.role !== "ADMIN"))
  )
    return new Response(
      "AI access is currently unavailable for this account.",
      { status: 403 },
    );
  // Use a database advisory lock to serialize per-account quota checks across instances.
  const reservation = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"ai-chat:" + session.user.id}))`;
    const prefix = `chat:${createHash("sha256").update(session.user.id).digest("hex")}:`;
    const count = await tx.aiActivity.count({
      where: {
        key: { startsWith: prefix },
        createdAt: { gte: new Date(Date.now() - 3600000) },
      },
    });
    if (count >= 30) return false;
    if (!(await tx.aiSpecialist.findUnique({ where: { id: "atlas" } })))
      return false;
    const job = await tx.aiActivity.create({
      data: {
        specialistId: "atlas",
        key: prefix + crypto.randomUUID(),
        kind: "CHAT",
        status: "RESERVED",
        destination: "CHAT",
      },
    });
    return job.id;
  });
  if (!reservation)
    return new Response(
      "The hourly AI limit has been reached, or specialists have not been initialized. Please try again later.",
      { status: 429 },
    );
  try {
    const result = await answerQuestion(
      parsed.data.message,
      parsed.data.specialist,
      parsed.data.history,
    );
    await prisma.aiActivity.update({
      where: { id: reservation },
      data: {
        status: result.provider === "privacy" ? "BLOCKED" : "COMPLETED",
        specialistId: result.id,
        provider: result.provider,
      },
    });
    const intro =
      result.provider === "privacy"
        ? ""
        : `**${result.name} · Tax Comp Pro AI Specialist**\n${!parsed.data.specialist && result.id !== "atlas" ? `Atlas routed your question to ${result.name}.\n` : ""}\n`;
    return new Response(intro + result.text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-AI-Specialist": result.id,
      },
    });
  } catch {
    await prisma.aiActivity
      .update({
        where: { id: reservation },
        data: { status: "FAILED", error: "Provider request failed" },
      })
      .catch(() => {});
    return new Response(
      "The AI specialist is temporarily unavailable. Please try again shortly.",
      { status: 503 },
    );
  }
}
