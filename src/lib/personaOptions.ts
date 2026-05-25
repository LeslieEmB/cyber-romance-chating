import type { AvatarConfig, GenderExpression, Persona, RelationshipStyle } from "@/lib/types";

export const genderOptions: Array<{ value: GenderExpression; label: string; hint: string }> = [
  { value: "feminine", label: "女性化", hint: "长发 / 柔和轮廓" },
  { value: "masculine", label: "男性化", hint: "短发 / 利落轮廓" },
  { value: "androgynous", label: "中性", hint: "轻盈 / 混合气质" },
  { value: "custom", label: "自定义", hint: "保留手动参数" }
];

export const relationshipOptions: Array<{ value: RelationshipStyle; label: string }> = [
  { value: "warm", label: "温柔稳定" },
  { value: "playful", label: "俏皮暧昧" },
  { value: "slow-burn", label: "慢热拉扯" },
  { value: "quiet", label: "安静陪伴" }
];

export const personalityOptions = ["温柔", "敏锐", "可靠", "毒舌但克制", "浪漫", "冷静", "占有欲低", "会撒娇"];

export const toneOptions = ["温暖", "克制", "甜一点", "冷淡一点", "安静松弛", "幽默自然"];

export const speechStyleOptions = [
  "短句",
  "多问问题",
  "少用套话",
  "偶尔调侃",
  "更直接",
  "更含蓄"
];

export const backgroundOptions = [
  "独立书店店员",
  "深夜酒吧调酒师",
  "自由职业摄影师",
  "心理学研究生",
  "产品设计师",
  "夜班便利店店员"
];

export const visualVibeOptions = ["霓虹雨巷", "蓝绿终端", "粉色电波", "废土夜航", "银色诊所", "旧磁带梦境"];

export const boundaryOptions = ["不施压", "不假装真人", "尊重现实关系", "不记录敏感隐私", "不制造依赖", "避免过度暧昧"];

export const hairOptions: Array<{ value: AvatarConfig["hairShape"]; label: string }> = [
  { value: "long", label: "长发" },
  { value: "short", label: "短发" },
  { value: "bob", label: "短波波" },
  { value: "spike", label: "电光刺发" },
  { value: "wave", label: "霓虹卷发" }
];

export const accessoryOptions: Array<{ value: AvatarConfig["accessory"]; label: string }> = [
  { value: "halo", label: "光环" },
  { value: "visor", label: "护目镜" },
  { value: "earring", label: "耳饰" },
  { value: "none", label: "无" }
];

export const eyeOptions = ["#2df8ff", "#ff3df2", "#39ff88", "#ffd166"];
export const outfitOptions = ["#2df8ff", "#ff3df2", "#39ff88", "#7c5cff"];

export function joinChoices(values: string[]) {
  return values.join("、");
}

export function splitChoices(value: string) {
  return value
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toggleChoice(values: string[], choice: string) {
  return values.includes(choice) ? values.filter((value) => value !== choice) : [...values, choice];
}

const legacyBackgroundMap: Record<string, string> = {
  "旧城区情感中继站 AI": "独立书店店员",
  "雨夜酒吧的记忆调音师": "深夜酒吧调酒师",
  "废弃轨道上的陪伴型仿生人": "自由职业摄影师",
  "霓虹诊所的梦境记录员": "心理学研究生",
  "私人频道里的夜巡程序": "夜班便利店店员"
};

const legacyToneMap: Record<string, string> = {
  "像深夜电台": "安静松弛",
  "像旧城区终端": "幽默自然"
};

export function humanizePersona(persona: Persona): Persona {
  return {
    ...persona,
    background: legacyBackgroundMap[persona.background] ?? persona.background,
    tone: legacyToneMap[persona.tone] ?? persona.tone,
    speechStyle: joinChoices(
      splitChoices(persona.speechStyle).map((style) => (style === "少量赛博黑话" ? "少用套话" : style))
    )
  };
}
