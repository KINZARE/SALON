import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("workspace browser QA covers conditional intake and waitlist offer states", async () => {
  const script = await fs.readFile("tests/e2e/workspace-browser-qa-scenarios.mjs", "utf8");
  assert.match(script, /Voorwaarde bron veld 2/);
  assert.match(script, /Bied eerstvolgende plek aan/);
  assert.match(script, /Aanbod/);
  assert.match(script, /niet gereserveerd/);
});
