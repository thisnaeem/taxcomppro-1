import { NextRequest } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

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
    const { message, history = [], provider = "openai", compliance = false } = await req.json();

    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPT + (compliance ? COMPLIANCE_ADDENDUM : "");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === "claude") {
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
              max_tokens: 1024,
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
              max_tokens: 1024,
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
