import assert from "node:assert/strict";
import { readFile, rm, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const providerFile = path.join(tmpdir(), `cyber-love-provider-${process.pid}.json`);
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

process.env.PROVIDER_CONFIG_FILE = providerFile;
process.env.DEEPSEEK_API_KEY = "sk-env-example-9999";
process.env.DEEPSEEK_BASE_URL = "https://env.deepseek.example";
process.env.DEEPSEEK_MODEL = "env-model";

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

const { ProviderConfigError, getProviderStatus, resolveProviderConfig, testAndSaveProviderConfig } = loadTsModule(
  path.join(root, "src/lib/ai/providerConfig.ts")
);

async function resetProvider() {
  await rm(providerFile, { force: true });
}

const candidate = {
  apiKey: "sk-saved-example-1234",
  baseUrl: "https://api.deepseek.com/",
  model: "deepseek-chat"
};

test("successful validation saves local provider config and exposes only a masked hint", async () => {
  await resetProvider();
  const status = await testAndSaveProviderConfig(candidate, async () => undefined);
  const file = await readFile(providerFile, "utf8");

  assert.equal(status.configured, true);
  assert.equal(status.connected, true);
  assert.equal(status.keyHint, "****1234");
  assert.equal(status.baseUrl, "https://api.deepseek.com");
  assert.doesNotMatch(JSON.stringify(status), /sk-saved-example/);
  assert.match(file, /sk-saved-example-1234/);
});

test("saved local config takes precedence over environment defaults", async () => {
  await resetProvider();
  await testAndSaveProviderConfig(candidate, async () => undefined);
  const config = await resolveProviderConfig();
  const status = await getProviderStatus();

  assert.equal(config.apiKey, candidate.apiKey);
  assert.equal(config.model, candidate.model);
  assert.equal(status.source, "file");
});

test("saved API key file is readable and writable only by the local OS user", { skip: process.platform === "win32" }, async () => {
  await resetProvider();
  await testAndSaveProviderConfig(candidate, async () => undefined);
  const info = await stat(providerFile);

  assert.equal(info.mode & 0o777, 0o600);
});

test("environment configuration remains a fallback before a local config is saved", async () => {
  await resetProvider();
  const config = await resolveProviderConfig();
  const status = await getProviderStatus();

  assert.equal(config.apiKey, "sk-env-example-9999");
  assert.equal(status.source, "environment");
  assert.equal(status.keyHint, "****9999");
});

test("a failed connection test does not write a candidate secret", async () => {
  await resetProvider();

  await assert.rejects(
    () =>
      testAndSaveProviderConfig(candidate, async () => {
        throw new Error("unauthorized");
      }),
    (error) => {
      assert.ok(error instanceof ProviderConfigError);
      assert.match(error.message, /连接失败/);
      return true;
    }
  );
  await assert.rejects(() => readFile(providerFile, "utf8"), { code: "ENOENT" });
});
