import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("local launch commands listen only on loopback by default", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.match(packageJson.scripts.dev, /--hostname 127\.0\.0\.1/);
  assert.match(packageJson.scripts.start, /--hostname 127\.0\.0\.1/);
});

test("local account and provider data stay outside git tracking", async () => {
  const ignoreFile = await readFile(".gitignore", "utf8");

  assert.match(ignoreFile, /^data\/auth-store\.json$/m);
  assert.match(ignoreFile, /^data\/provider-config\.json$/m);
  assert.match(ignoreFile, /^\.env\*\.local$/m);
});
