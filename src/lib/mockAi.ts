import type { Memory, Persona } from "@/lib/types";
import { makeLocalCompanionReply } from "@/lib/ai/localReply";
import { extractMemoryCandidate } from "@/lib/memory/extract";

export function makeCompanionReply(message: string, persona: Persona, memories: Memory[]) {
  return makeLocalCompanionReply(message, persona, memories);
}

export function extractMemoryFromMessage(message: string): Memory | null {
  return extractMemoryCandidate(message);
}
