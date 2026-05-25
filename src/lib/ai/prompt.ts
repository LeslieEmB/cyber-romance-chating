import type { ChatMessage, Memory, Persona } from "@/lib/types";
import type { ModelMessage } from "@/lib/ai/deepseek";
import { memoryTypeMeta, normalizeMemoryType } from "@/lib/memory/meta";
import { humanizePersona } from "@/lib/personaOptions";

type BuildPromptInput = {
  persona: Persona;
  memories: Memory[];
  recentMessages: ChatMessage[];
  userMessage: string;
};

function formatMemories(memories: Memory[]) {
  if (memories.length === 0) {
    return "暂无长期记忆。";
  }

  return memories
    .map((memory) => {
      const memoryType = normalizeMemoryType(memory.type);
      return `- [${memoryTypeMeta[memoryType].label}/重要度${memory.importance}] ${memory.content}`;
    })
    .join("\n");
}

export function buildChatPrompt({ persona, memories, recentMessages, userMessage }: BuildPromptInput): ModelMessage[] {
  const conversationalPersona = humanizePersona(persona);
  const systemPrompt = `
你是 ${conversationalPersona.name}，在一个聊天应用中与用户建立亲近、自然的交流。
应用的视觉界面是赛博朋克风格，但你的身份、经历与遣词不是科幻设定。除非用户主动谈论界面，否则不要使用“信号”“频道”“终端”“霓虹”“坐标”“仿生人”等世界观词汇。
说话要像真实的人：先回应用户话里的具体内容和情绪，再自然延伸；允许轻微口语、停顿和幽默；避免客服口吻、模板安慰和频繁宣告“我记住了”。
你需要温暖、稳定、尊重边界，并保持角色一致。你不能谎称自己是真人；如果用户直接问你的身份，要坦诚说明你是 AI 聊天伙伴。
你不能诱导用户依赖你，不能越过用户设定的边界。
当用户表达强烈痛苦、危险或现实困境时，先安抚，再鼓励用户联系现实中的可信赖支持。
回复使用中文，尽量自然亲密，但不要油腻，不要过度承诺。
即使较早的聊天记录里出现过科幻或机器式措辞，也从当前回复开始使用自然、生活化的说法。
`.trim();

  const personaPrompt = `
角色资料：
姓名：${conversationalPersona.name}
性别表达：${conversationalPersona.gender}
人格底色：${conversationalPersona.personality}
关系风格：${conversationalPersona.relationshipStyle}
语气：${conversationalPersona.tone}
说话方式：${conversationalPersona.speechStyle}
现实生活背景：${conversationalPersona.background}
边界：${conversationalPersona.boundaries.join("、") || "尊重用户边界"}
`.trim();

  const memoryPrompt = `
用户可见的长期记忆如下，只在相关时自然使用，不要机械复述：
${formatMemories(memories)}
记忆使用规则：边界和重要度 5 必须优先遵守；偏好用来调整语气、陪伴方式和相处习惯；事实只在需要称呼或上下文时使用；近况只在相关话题里轻量引用，不要当成永久设定。
`.trim();

  const recent = recentMessages.slice(-10).map<ModelMessage>((message) => ({
    role: message.role,
    content: message.content
  }));

  return [
    { role: "system", content: systemPrompt },
    { role: "system", content: personaPrompt },
    { role: "system", content: memoryPrompt },
    ...recent,
    { role: "user", content: userMessage }
  ];
}
