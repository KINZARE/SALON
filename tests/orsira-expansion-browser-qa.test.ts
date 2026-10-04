import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("workspace browser QA covers conditional intake and waitlist offer states", async () => {
  const [spec,script] = await Promise.all([
    fs.readFile("tests/e2e/workspace.spec.mjs", "utf8"),
    fs.readFile("tests/e2e/orsira-expansion-pr-a-scenarios.mjs", "utf8"),
  ]);
  assert.match(spec, /runExpansionPrAQa/);
  assert.match(script, /Voorwaarde bron veld 2/);
  assert.match(script, /Bied eerstvolgende plek aan/);
  assert.match(script, /Aanbod/);
  assert.match(script, /niet gereserveerd/);
});
