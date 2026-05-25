import type { Memory } from "@/lib/types";
import { normalizeMemoryType } from "@/lib/memory/meta";

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[，。！？、,.!?]/g, " ")
        .split(/\s+/)
        .flatMap((part) => (part.length > 1 ? [part, ...Array.from(part)] : [part]))
        .filter(Boolean)
    )
  );
}

export function retrieveRelevantMemories(memories: Memory[], query: string, limit = 6) {
  const queryTokens = tokenize(query);
  const normalizedMemories = memories.map((memory) => ({
    ...memory,
    type: normalizeMemoryType(memory.type)
  }));
  const pinned = normalizedMemories
    .filter((memory) => memory.type === "boundary" || memory.importance >= 5)
    .slice(0, 3);

  const ranked = normalizedMemories
    .map((memory) => {
      const contentTokens = tokenize(memory.content);
      const overlap = queryTokens.filter((token) => contentTokens.includes(token)).length;
      const typeBoost =
        memory.type === "boundary"
          ? 6
          : memory.type === "preference"
            ? 4
            : memory.type === "summary"
              ? 2
              : 1;
      return {
        memory,
        score: overlap * 2.5 + memory.importance + typeBoost
      };
    })
    .filter((item) => item.score >= 5 || item.memory.importance >= 4)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.memory);

  const merged = [...pinned, ...ranked];
  return Array.from(new Map(merged.map((memory) => [memory.id, memory])).values()).slice(0, limit);
}
