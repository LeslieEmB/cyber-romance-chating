import type { MemoryType } from "@/lib/types";

export type MemoryTypeMeta = {
  label: string;
  hint: string;
  description: string;
  impact: string;
  example: string;
  defaultImportance: number;
};

export const memoryTypeOrder: MemoryType[] = ["preference", "boundary", "summary", "fact"];

export const memoryTypeMeta: Record<MemoryType, MemoryTypeMeta> = {
  preference: {
    label: "偏好",
    hint: "语气、陪伴方式、聊天节奏",
    description: "喜欢或不喜欢的回复方式。",
    impact: "影响日常回复风格",
    example: "我喜欢你说话温柔一点，回答不用太长。",
    defaultImportance: 4
  },
  boundary: {
    label: "边界",
    hint: "最高优先级，回复会优先避开",
    description: "明确不希望出现的内容或语气。",
    impact: "优先约束回复",
    example: "不要用命令式语气，也不要制造依赖压力。",
    defaultImportance: 5
  },
  summary: {
    label: "近况",
    hint: "最近正在发生的事",
    description: "短期背景和最近状态。",
    impact: "只在相关话题里调用",
    example: "我这周在准备作品集，压力有点大。",
    defaultImportance: 3
  },
  fact: {
    label: "事实",
    hint: "稳定的个人资料，例如称呼、职业、城市",
    description: "相对稳定的个人信息。",
    impact: "减少重复询问",
    example: "我叫 Leslie，现在在上海做产品设计。",
    defaultImportance: 3
  }
};

export function normalizeMemoryType(value: unknown): MemoryType {
  if (value === "relationship") {
    return "preference";
  }

  return memoryTypeOrder.includes(value as MemoryType) ? (value as MemoryType) : "preference";
}

export const memoryTypeOptions = memoryTypeOrder.map((value) => ({
  value,
  ...memoryTypeMeta[value]
}));
