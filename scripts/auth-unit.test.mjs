import assert from "node:assert/strict";
import { readFile, rm, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const authDataFile = path.join(tmpdir(), `cyber-love-auth-${process.pid}.json`);
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

process.env.AUTH_DATA_FILE = authDataFile;

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

const {
  AuthError,
  authenticateUser,
  createSession,
  getUserBySessionToken,
  registerUser,
  saveUserPersona
} = loadTsModule(path.join(root, "src/lib/auth/store.ts"));

const persona = {
  name: "NOVA",
  gender: "feminine",
  personality: "温柔",
  relationshipStyle: "warm",
  visualVibe: "霓虹雨巷",
  boundaries: ["不施压"],
  speechStyle: "短句",
  background: "独立书店店员",
  tone: "温暖",
  avatar: {
    hairShape: "long",
    eyeColor: "#2df8ff",
    accessory: "earring",
    outfitColor: "#ff3df2",
    mood: "calm"
  }
};

async function resetStore() {
  await rm(authDataFile, { force: true });
}

test("registration stores a password hash and returns only public account data", async () => {
  await resetStore();
  const user = await registerUser({ email: "Leslie@Example.com", nickname: "Leslie", password: "secret12" });
  const written = await readFile(authDataFile, "utf8");

  assert.equal(user.email, "leslie@example.com");
  assert.equal(user.nickname, "Leslie");
  assert.equal(user.hasOnboarded, false);
  assert.equal("passwordHash" in user, false);
  assert.doesNotMatch(written, /secret12/);
  assert.match(written, /passwordHash/);
});

test("auth data file is readable and writable only by the local OS user", { skip: process.platform === "win32" }, async () => {
  await resetStore();
  await registerUser({ email: "private@example.com", nickname: "私密用户", password: "secret12" });
  const info = await stat(authDataFile);

  assert.equal(info.mode & 0o777, 0o600);
});

test("login accepts the correct password and rejects the wrong password", async () => {
  await resetStore();
  await registerUser({ email: "user@example.com", nickname: "小光", password: "correct7" });

  assert.equal((await authenticateUser("USER@example.com", "correct7")).nickname, "小光");
  await assert.rejects(() => authenticateUser("user@example.com", "wrong77"), (error) => {
    assert.ok(error instanceof AuthError);
    assert.equal(error.status, 401);
    return true;
  });
});

test("registration rejects an already registered email", async () => {
  await resetStore();
  await registerUser({ email: "same@example.com", nickname: "晨光", password: "secret12" });

  await assert.rejects(
    () => registerUser({ email: "SAME@example.com", nickname: "另一个", password: "secret12" }),
    (error) => {
      assert.ok(error instanceof AuthError);
      assert.equal(error.status, 409);
      return true;
    }
  );
});

test("session tokens recover an account without persisting raw token values", async () => {
  await resetStore();
  const user = await registerUser({ email: "session@example.com", nickname: "夜灯", password: "secret12" });
  const session = await createSession(user.id);
  const written = await readFile(authDataFile, "utf8");

  assert.equal((await getUserBySessionToken(session.token))?.id, user.id);
  assert.doesNotMatch(written, new RegExp(session.token));
});

test("initialized persona is saved against the signed-in member account", async () => {
  await resetStore();
  const user = await registerUser({ email: "persona@example.com", nickname: "弦月", password: "secret12" });
  const updated = await saveUserPersona(user.id, persona);

  assert.equal(updated.hasOnboarded, true);
  assert.equal(updated.persona?.name, "NOVA");
});

test("invalid persona data cannot be persisted into an account", async () => {
  await resetStore();
  const user = await registerUser({ email: "invalid-persona@example.com", nickname: "校验员", password: "secret12" });

  await assert.rejects(
    () => saveUserPersona(user.id, { ...persona, avatar: null }),
    (error) => {
      assert.ok(error instanceof AuthError);
      assert.equal(error.status, 400);
      return true;
    }
  );
});
