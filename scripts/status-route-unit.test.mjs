import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const authDataFile = path.join(tmpdir(), `cyber-love-status-auth-${process.pid}.json`);
const providerFile = path.join(tmpdir(), `cyber-love-status-provider-${process.pid}.json`);
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

process.env.AUTH_DATA_FILE = authDataFile;
process.env.PROVIDER_CONFIG_FILE = providerFile;
process.env.DEEPSEEK_API_KEY = "sk-status-example-5678";
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

const { NextRequest } = nodeRequire("next/server");
const { createSession, registerUser } = loadTsModule(path.join(root, "src/lib/auth/store.ts"));
const { GET } = loadTsModule(path.join(root, "src/app/api/status/route.ts"));
const { POST: saveProviderConfig } = loadTsModule(path.join(root, "src/app/api/provider/config/route.ts"));

async function resetData() {
  await rm(authDataFile, { force: true });
  await rm(providerFile, { force: true });
}

test("anonymous users cannot inspect provider status", async () => {
  await resetData();
  const response = await GET(new NextRequest("http://localhost/api/status"));

  assert.equal(response.status, 401);
});

test("signed-in users see only masked provider status", async () => {
  await resetData();
  const user = await registerUser({ email: "status@example.com", nickname: "连接用户", password: "secret12" });
  const session = await createSession(user.id);
  const response = await GET(
    new NextRequest("http://localhost/api/status", {
      headers: { cookie: `cyber-love-session=${session.token}` }
    })
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.keyHint, "****5678");
  assert.doesNotMatch(JSON.stringify(body), /sk-status-example/);
});

test("anonymous users cannot submit a provider key for testing or storage", async () => {
  await resetData();
  const response = await saveProviderConfig(
    new NextRequest("http://localhost/api/provider/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey: "sk-should-not-be-tested",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat"
      })
    })
  );

  assert.equal(response.status, 401);
});
