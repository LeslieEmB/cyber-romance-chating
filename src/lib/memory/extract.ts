import { createClientId, nowIso } from "@/lib/runtime";
import type { Memory } from "@/lib/types";

const boundaryWords = ["不要", "别", "不能", "不想", "边界", "停止", "讨厌"];
const preferenceWords = ["喜欢", "偏好", "想要", "希望", "更爱", "习惯", "更喜欢", "不喜欢"];
const interactionWords = [
  "陪我",
  "相处",
  "互动",
  "聊天节奏",
  "晚安",
  "早安",
  "追问",
  "安静",
  "讲道理",
  "恋人",
  "伴侣",
  "亲密"
];
const recentStateWords = ["最近", "今天", "这周", "这几天", "正在", "准备", "压力", "考试", "项目", "面试", "出差", "搬家"];
const factPatterns = [
  /我叫(.{1,18})/,
  /我的名字是(.{1,18})/,
  /我是(.{2,24})/,
  /我在(.{2,24})/,
  /我工作(.{1,24})/
];

function cleanContent(content: string) {
  return content
    .replace(/^(请|你要|帮我)?记住[：:，,\s]*/u, "")
    .replace(/^以后[，,\s]*/u, "以后")
    .trim();
}

function isMostlyQuestion(content: string) {
  return /[？?]$/.test(content) && !/(记住|我叫|我的名字|我喜欢|我不喜欢|不要|别|希望)/.test(content);
}

export function extractMemoryCandidate(message: string): Memory | null {
  const rawContent = message.trim();
  const content = cleanContent(rawContent);

  if (content.length < 8) {
    return null;
  }

  if (isMostlyQuestion(content)) {
    return null;
  }

  const explicitRemember = /记住|以后|下次|你要知道|你应该知道/.test(rawContent);
  const matchedFact = factPatterns.some((pattern) => pattern.test(content));
  const matchedInteraction = interactionWords.some((word) => content.includes(word));
  const matchedPreference = preferenceWords.some((word) => content.includes(word));
  const matchedRecentState = recentStateWords.some((word) => content.includes(word));
  const type = boundaryWords.some((word) => content.includes(word))
    ? "boundary"
    : matchedFact
      ? "fact"
      : matchedInteraction || matchedPreference
        ? "preference"
        : matchedRecentState
          ? "summary"
          : "summary";

  if (type === "summary" && (!explicitRemember || content.length < 12)) {
    return null;
  }

  const importance =
    type === "boundary"
      ? 5
      : explicitRemember
        ? type === "summary"
          ? 4
          : 5
        : type === "preference"
          ? 4
          : 3;

  return {
    id: createClientId("memory"),
    type,
    content: content.length > 72 ? `${content.slice(0, 72)}...` : content,
    importance,
    source: "user_message",
    updatedAt: nowIso()
  };
}
