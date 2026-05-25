import { NextResponse } from "next/server";
import { buildChatPrompt } from "@/lib/ai/prompt";
import { getDeepSeekConfig, hasDeepSeekApiKey, requestDeepSeekChat } from "@/lib/ai/deepseek";
import { makeLocalCompanionReply } from "@/lib/ai/localReply";
import { extractMemoryCandidate } from "@/lib/memory/extract";
import { retrieveRelevantMemories } from "@/lib/memory/retrieve";
import type { AppSettings, ChatMessage, Memory, Persona } from "@/lib/types";

export const runtime = "nodejs";

type ChatRequestBody = {
  message?: string;
  persona?: Persona;
  messages?: ChatMessage[];
  memories?: Memory[];
  settings?: Partial<AppSettings>;
};

function isPersona(value: unknown): value is Persona {
  return Boolean(value && typeof value === "object" && "name" in value && "relationshipStyle" in value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (!isPersona(body.persona)) {
      return NextResponse.json({ error: "persona is required" }, { status: 400 });
    }

    const memories = Array.isArray(body.memories) ? body.memories : [];
    const recentMessages = Array.isArray(body.messages) ? body.messages : [];
    const settings = body.settings ?? {};
    const retrievedMemories = retrieveRelevantMemories(memories, userMessage);
    const extractedMemory =
      settings.localMemory === false || settings.privacyMode ? null : extractMemoryCandidate(userMessage);
    const promptMessages = buildChatPrompt({
      persona: body.persona,
      memories: retrievedMemories,
      recentMessages,
      userMessage
    });

    let reply = "";
    let provider: "deepseek" | "local" | "local-fallback" = "local";
    let warning: string | undefined;

    if (hasDeepSeekApiKey()) {
      try {
        reply = await requestDeepSeekChat(promptMessages, settings.model);
        provider = "deepseek";
      } catch (error) {
        warning = error instanceof Error ? error.message : "DeepSeek request failed.";
        reply = makeLocalCompanionReply(userMessage, body.persona, retrievedMemories);
        provider = "local-fallback";
      }
    } else {
      reply = makeLocalCompanionReply(userMessage, body.persona, retrievedMemories);
    }

    return NextResponse.json({
      reply,
      memory: extractedMemory,
      provider,
      model: getDeepSeekConfig(settings.model).model,
      retrievedMemoryIds: retrievedMemories.map((memory) => memory.id),
      warning
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected chat error"
      },
      { status: 500 }
    );
  }
}
