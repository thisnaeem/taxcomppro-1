import { NextRequest } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are Atlas AI, a highly knowledgeable tax assistant for TaxCompPro — a professional platform for CPAs, tax professionals, and taxpayers.

You provide accurate, concise, and actionable tax guidance. You cover topics including:
- Federal & state tax filing, deadlines, and extensions
- IRS regulations, audits, and correspondence
- Deductions, credits, and tax-saving strategies
- Schedule C, partnerships, S-corps, and business taxes
- Capital gains, crypto, real estate, and investment taxes
- Payroll taxes, estimated payments, and penalties
- Compliance, record-keeping, and documentation

Always be professional, clear, and precise. Cite relevant IRS codes or publications when helpful. If a question requires a licensed professional's advice, say so clearly but still provide educational context.`;

const COMPLIANCE_ADDENDUM = `\n\nYou are currently in COMPLIANCE MODE. Prioritize regulatory accuracy, cite specific IRS codes and publications, emphasize documentation requirements, and flag any areas requiring professional judgment.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], provider, compliance = false } = await req.json();

    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    const settings = await prisma.atlasSettings.findFirst().catch(() => null);
    const activeProvider = provider || settings?.defaultProvider || "openai";
    const maxTokens = settings?.maxTokens || 1024;
    const basePrompt = settings?.systemPromptExtra?.trim()
      ? `${settings.systemPromptExtra.trim()}\n\n${SYSTEM_PROMPT}`
      : SYSTEM_PROMPT;
    const systemPrompt = basePrompt + (compliance ? COMPLIANCE_ADDENDUM : "");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (activeProvider === "claude") {
            // ── Anthropic Claude ──────────────────────────────────────────
            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const msgs: Anthropic.MessageParam[] = [
              ...history.map((m: { role: string; content: string }) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: m.content,
              })),
              { role: "user", content: message },
            ];

            const claudeStream = await client.messages.stream({
              model: "claude-3-haiku-20240307",
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: msgs,
            });

            for await (const chunk of claudeStream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
          } else {
            // ── OpenAI GPT-4o ─────────────────────────────────────────────
            const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
              { role: "system", content: systemPrompt },
              ...history.map((m: { role: string; content: string }) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: m.content,
              })),
              { role: "user", content: message },
            ];

            const openaiStream = await client.chat.completions.create({
              model: "gpt-4o",
              messages: msgs,
              stream: true,
              max_tokens: maxTokens,
            });

            for await (const chunk of openaiStream) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI error";
          controller.enqueue(encoder.encode(`[ERROR]: ${msg}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}
