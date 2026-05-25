import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const providerFile = path.join(tmpdir(), `cyber-love-chat-provider-${process.pid}.json`);
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

process.env.PROVIDER_CONFIG_FILE = providerFile;
process.env.DEEPSEEK_API_KEY = "";
process.env.DEEPSEEK_BASE_URL = "https://api.deepseek.com";
process.env.DEEPSEEK_MODEL = "deepseek-chat";

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
  const source = nodeRequire("node:fs").readFileSync(normalized, "utf8");
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
    return tsModule ? loadTsModule(tsModule) : nodeRequire(specifier);
  }
  new Function("require", "module", "exports", output)(localRequire, moduleRecord, moduleRecord.exports);
  return moduleRecord.exports;
}

const { POST } = loadTsModule(path.join(root, "src/app/api/chat/route.ts"));

const persona = {
  name: "NOVA",
  gender: "feminine",
  personality: "温柔、敏锐",
  relationshipStyle: "warm",
  visualVibe: "霓虹雨巷",
  boundaries: ["尊重界限"],
  speechStyle: "自然短句",
  background: "独立书店店员",
  tone: "温暖",
  avatar: {
    hairShape: "long",
    eyeColor: "#2df8ff",
    accessory: "none",
    outfitColor: "#ff3df2",
    mood: "calm"
  }
};

function chatRequest(body) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("chat falls back to local replies when no DeepSeek key is configured", async () => {
  await rm(providerFile, { force: true });
  const response = await POST(chatRequest({ message: "我喜欢雨天。", persona, messages: [], memories: [] }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, "local");
  assert.equal(typeof body.reply, "string");
  assert.ok(body.reply.length > 0);
});

test("privacy mode suppresses automatic memory extraction", async () => {
  await rm(providerFile, { force: true });
  const response = await POST(
    chatRequest({
      message: "请记住我喜欢雨天。",
      persona,
      messages: [],
      memories: [],
      settings: { privacyMode: true }
    })
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.memory, null);
});

test("chat rejects requests without message or persona", async () => {
  const noMessage = await POST(chatRequest({ persona }));
  const noPersona = await POST(chatRequest({ message: "你好" }));

  assert.equal(noMessage.status, 400);
  assert.equal(noPersona.status, 400);
});
