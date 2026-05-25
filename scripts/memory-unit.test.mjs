import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function resolveTsModule(specifier, parentDir = root) {
  if (specifier.startsWith("@/")) {
    return path.join(root, "src", `${specifier.slice(2)}.ts`);
  }

  if (specifier.startsWith(".")) {
    return path.resolve(parentDir, `${specifier}.ts`);
  }

  return null;
}

function loadTsModule(filePath) {
  const normalized = path.normalize(filePath);

  if (moduleCache.has(normalized)) {
    return moduleCache.get(normalized).exports;
  }

  const source = readFileSync(normalized, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const moduleRecord = { exports: {} };
  moduleCache.set(normalized, moduleRecord);

  function localRequire(specifier) {
    const tsModule = resolveTsModule(specifier, path.dirname(normalized));

    if (tsModule) {
      return loadTsModule(tsModule);
    }

    return nodeRequire(specifier);
  }

  const execute = new Function("require", "module", "exports", output);
  execute(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord.exports;
}

const { extractMemoryCandidate } = loadTsModule(path.join(root, "src/lib/memory/extract.ts"));
const { retrieveRelevantMemories } = loadTsModule(path.join(root, "src/lib/memory/retrieve.ts"));
const { memoryTypeMeta } = loadTsModule(path.join(root, "src/lib/memory/meta.ts"));
const { makeLocalCompanionReply } = loadTsModule(path.join(root, "src/lib/ai/localReply.ts"));
const { buildChatPrompt } = loadTsModule(path.join(root, "src/lib/ai/prompt.ts"));
const { createAvatarConfig } = loadTsModule(path.join(root, "src/lib/avatar.ts"));
const { backgroundOptions, genderOptions, humanizePersona, isCustomBackground } = loadTsModule(
  path.join(root, "src/lib/personaOptions.ts")
);

const personaFixture = {
  name: "NOVA",
  gender: "androgynous",
  personality: "温柔、敏锐",
  relationshipStyle: "warm",
  visualVibe: "霓虹雨巷",
  boundaries: ["不施压"],
  speechStyle: "短句、少量赛博黑话",
  background: "旧城区情感中继站 AI",
  tone: "像旧城区终端",
  avatar: {
    hairShape: "short",
    eyeColor: "#2df8ff",
    accessory: "none",
    outfitColor: "#39ff88",
    mood: "calm"
  }
};

test("extracts preference memories from stable user preferences", () => {
  const memory = extractMemoryCandidate("我喜欢你用温柔、简短的方式回复。");

  assert.equal(memory.type, "preference");
  assert.equal(memory.importance, 4);
  assert.match(memory.content, /温柔/);
});

test("extracts boundary memories with highest importance", () => {
  const memory = extractMemoryCandidate("不要用过度暧昧的语气。");

  assert.equal(memory.type, "boundary");
  assert.equal(memory.importance, 5);
});

test("extracts user facts for stable profile context", () => {
  const memory = extractMemoryCandidate("我叫Leslie，是一名产品设计师。");

  assert.equal(memory.type, "fact");
  assert.equal(memory.importance, 3);
});

test("folds companionship patterns into preference memories", () => {
  const memory = extractMemoryCandidate("陪我安静地待一会儿，今天不用太多问题。");

  assert.equal(memory.type, "preference");
  assert.equal(memory.importance, 4);
});

test("extracts recent situation memories as lightweight context", () => {
  const memory = extractMemoryCandidate("请记住：我这周在准备作品集，压力有点大。");

  assert.equal(memory.type, "summary");
  assert.equal(memory.importance, 4);
  assert.match(memory.content, /作品集/);
});

test("does not memorize ordinary questions", () => {
  assert.equal(extractMemoryCandidate("你是谁？"), null);
});

test("explicit remember requests become stronger memories", () => {
  const memory = extractMemoryCandidate("请记住：我希望聊天节奏慢一点。");

  assert.equal(memory.type, "preference");
  assert.equal(memory.importance, 5);
  assert.equal(memory.content, "我希望聊天节奏慢一点。");
});

test("retrieval prioritizes boundaries and high-importance memories", () => {
  const memories = [
    extractMemoryCandidate("不要用过度暧昧的语气。"),
    extractMemoryCandidate("我喜欢你用温柔、简短的方式回复。"),
    extractMemoryCandidate("陪我安静地待一会儿，今天不用太多问题。"),
    extractMemoryCandidate("我叫Leslie，是一名产品设计师。")
  ].filter(Boolean);
  const retrieved = retrieveRelevantMemories(memories, "今天可以安静一点陪我聊吗？", 3);

  assert.equal(retrieved.length, 3);
  assert.equal(retrieved[0].type, "boundary");
  assert.ok(retrieved.some((memory) => memory.type === "preference"));
});

test("retrieval can surface recent situation only when relevant", () => {
  const memories = [
    extractMemoryCandidate("请记住：我这周在准备作品集，压力有点大。"),
    extractMemoryCandidate("我叫Leslie，是一名产品设计师。"),
    extractMemoryCandidate("我喜欢你用温柔、简短的方式回复。")
  ].filter(Boolean);
  const retrieved = retrieveRelevantMemories(memories, "作品集快交了，你陪我梳理一下压力好吗？", 2);

  assert.ok(retrieved.some((memory) => memory.type === "summary"));
});

test("memory labels keep the visible set focused", () => {
  assert.deepEqual(Object.keys(memoryTypeMeta), ["preference", "boundary", "summary", "fact"]);
  assert.equal(memoryTypeMeta.summary.label, "近况");
  assert.equal(memoryTypeMeta.preference.label, "偏好");
});

test("legacy cyber persona settings migrate to everyday conversation settings", () => {
  const persona = humanizePersona(personaFixture);

  assert.equal(persona.background, "独立书店店员");
  assert.equal(persona.tone, "幽默自然");
  assert.match(persona.speechStyle, /少用套话/);
  assert.doesNotMatch(persona.speechStyle, /赛博/);
});

test("custom living backgrounds stay distinct from preset choices", () => {
  assert.ok(backgroundOptions.includes("独立书店店员"));
  assert.equal(isCustomBackground("独立书店店员"), false);
  assert.equal(isCustomBackground("独立游戏音乐人"), true);
});

test("scene atmosphere selection does not regenerate companion appearance", () => {
  const rainAvatar = createAvatarConfig("NOVA", "androgynous", "霓虹雨巷");
  const terminalAvatar = createAvatarConfig("NOVA", "androgynous", "蓝绿终端");

  assert.deepEqual(terminalAvatar, rainAvatar);
});

test("freeform expression clearly means appearance customization", () => {
  const customOption = genderOptions.find((option) => option.value === "custom");

  assert.equal(customOption.label, "自由塑造");
  assert.equal(customOption.hint, "只改外观");
});

test("brand title preserves readable glyphs while mosaic fragments animate the entrance", () => {
  const titleSource = readFileSync(path.join(root, "src/components/brand/PixelSignalTitle.tsx"), "utf8");

  assert.match(titleSource, /signal-character/);
  assert.match(titleSource, /signal-mosaic/);
  assert.match(titleSource, /mosaicBlocks/);
  assert.doesNotMatch(titleSource, /pixelCharacters/);
  assert.doesNotMatch(titleSource, /signal-pixel-form/);
});

test("chat prompt separates visual styling from natural dialogue", () => {
  const prompt = buildChatPrompt({
    persona: personaFixture,
    memories: [],
    recentMessages: [],
    userMessage: "今天有点累。"
  });
  const systemPrompt = prompt[0].content;
  const personaPrompt = prompt[1].content;

  assert.match(systemPrompt, /不要使用“信号”“频道”“终端”“霓虹”“坐标”“仿生人”/);
  assert.match(systemPrompt, /说话要像真实的人/);
  assert.match(personaPrompt, /现实生活背景：独立书店店员/);
});

test("local fallback avoids robotic cyber catchphrases", () => {
  const reply = makeLocalCompanionReply("今天有点累，想随便聊聊。", humanizePersona(personaFixture), []);

  assert.doesNotMatch(reply, /信号|频道|终端|霓虹|坐标|在线/);
  assert.match(reply, /听|聊|慢慢|心思|明白/);
});
