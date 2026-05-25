import type { Memory, Persona } from "@/lib/types";

const replyFragments = [
  "嗯，我听到了。你想继续说说发生了什么吗？",
  "听起来这件事挺占心思的。你现在更想被听着，还是一起想想办法？",
  "我在听。你不用急着把话组织得很完整。",
  "好，我明白你的意思了。那你现在最在意的是哪一部分？",
  "这听着不太容易。先不用硬撑，我们慢慢聊。"
];

export function makeLocalCompanionReply(message: string, persona: Persona, memories: Memory[]) {
  const index = Math.abs(message.length + persona.name.length + memories.length) % replyFragments.length;
  const memoryHint = memories.find((memory) => memory.type !== "boundary")?.content;
  const prefix =
    persona.relationshipStyle === "playful"
      ? "欸，"
      : persona.relationshipStyle === "quiet"
        ? "嗯，"
        : persona.relationshipStyle === "slow-burn"
          ? "不着急，"
          : "";
  const askingAboutMemory = /(记得|了解我|知道我|我是什么|我是谁)/.test(message);

  if (askingAboutMemory && memoryHint) {
    return `${prefix}我记得你提过：${memoryHint}。这件事最近有什么变化吗？`;
  }

  return `${prefix}${replyFragments[index]}`;
}
