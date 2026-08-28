import { NextRequest } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { ATLAS_SUPPORT_SYSTEM_PROMPT, ATLAS_WEBSITE_QA } from "@/lib/atlas-support-knowledge";

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], provider, userContext, pageUrl } = await req.json();

    if (!message?.trim()) {
      return new Response("Message is required", { status: 400 });
    }

    const settings = await prisma.atlasSettings.findFirst().catch(() => null);
    const activeProvider = provider || settings?.defaultProvider || "openai";
    const maxTokens = settings?.maxTokens || 1024;

    // Fetch custom approved knowledge base items from DB
    const customItems = await prisma.atlasKnowledgeItem.findMany({
      where: { active: true },
      select: { question: true, approvedAnswer: true, category: true },
    }).catch(() => []);

    const allKnowledge = [
      ...ATLAS_WEBSITE_QA.map((q) => `Q: ${q.question}\nA: ${q.answer}`),
      ...customItems.map((k) => `Q: ${k.question}\nA: ${k.approvedAnswer}`),
    ].join("\n\n");

    const userContextStr = userContext
      ? `CURRENT USER CONTEXT:
- Name: ${userContext.name || "Guest / Anonymous"}
- Email: ${userContext.email || "Not signed in"}
- Membership Tier: ${userContext.tier || "FREE"}
- Current Page: ${pageUrl || "/"}
- Purchased Products: ${userContext.purchases?.join(", ") || "None"}
`
      : `CURRENT USER CONTEXT:
- Visitor is currently exploring the site as a guest.
- Current Page: ${pageUrl || "/"}`;

    const systemPrompt = `${ATLAS_SUPPORT_SYSTEM_PROMPT}

${userContextStr}

APPROVED WEBSITE SUPPORT KNOWLEDGE BASE:
${allKnowledge}

${settings?.systemPromptExtra?.trim() ? `ADDITIONAL ADMIN INSTRUCTIONS:\n${settings.systemPromptExtra.trim()}` : ""}
`;

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

            const candidateModels = [
              "claude-haiku-4-5-20251001",
              "claude-sonnet-4-5-20250929",
              "claude-3-5-haiku-20241022",
              "claude-3-haiku-20240307",
            ];

            let claudeStream = null;
            let lastErr: unknown = null;

            for (const modelName of candidateModels) {
              try {
                claudeStream = await client.messages.stream({
                  model: modelName,
                  max_tokens: maxTokens,
                  system: systemPrompt,
                  messages: msgs,
                });
                break;
              } catch (e: any) {
                lastErr = e;
                if (e?.status === 404 || e?.message?.includes("not_found")) {
                  continue;
                }
                throw e;
              }
            }

            if (!claudeStream) {
              throw lastErr || new Error("No compatible Claude model found");
            }

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
