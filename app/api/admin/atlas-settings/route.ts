import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSettings() {
  let s = await prisma.atlasSettings.findFirst();
  if (!s) {
    s = await prisma.atlasSettings.create({
      data: { updatedAt: new Date() },
    });
  }
  return s;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const s = await getSettings();
  return NextResponse.json({
    widgetEnabled: s.widgetEnabled,
    defaultProvider: s.defaultProvider,
    allowedTiers: s.allowedTiers,
    maxTokens: s.maxTokens,
    systemPrompt: s.systemPromptExtra || "",
    systemPromptExtra: s.systemPromptExtra || "",
  });
}

async function saveSettings(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const s = await getSettings();
  const updated = await prisma.atlasSettings.update({
    where: { id: s.id },
    data: {
      widgetEnabled: body.widgetEnabled !== undefined ? Boolean(body.widgetEnabled) : s.widgetEnabled,
      defaultProvider: body.defaultProvider || s.defaultProvider,
      allowedTiers: Array.isArray(body.allowedTiers) ? body.allowedTiers : s.allowedTiers,
      maxTokens: typeof body.maxTokens === "number" ? body.maxTokens : s.maxTokens,
      systemPromptExtra: (body.systemPrompt !== undefined ? body.systemPrompt : body.systemPromptExtra) ?? s.systemPromptExtra,
      updatedAt: new Date(),
    },
  });
  return NextResponse.json({
    widgetEnabled: updated.widgetEnabled,
    defaultProvider: updated.defaultProvider,
    allowedTiers: updated.allowedTiers,
    maxTokens: updated.maxTokens,
    systemPrompt: updated.systemPromptExtra,
    systemPromptExtra: updated.systemPromptExtra,
  });
}

export async function PUT(req: NextRequest) {
  return saveSettings(req);
}

export async function PATCH(req: NextRequest) {
  return saveSettings(req);
}
