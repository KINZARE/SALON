import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("ORSIRA responsive QA covers required viewports, overflow, brand and focus", async () => {
  const [script, css] = await Promise.all([
    fs.readFile("scripts/orsira-responsive-qa.mjs", "utf8"),
    fs.readFile("src/app/globals.css", "utf8"),
  ]);

  for (const width of [320, 375, 390, 430, 768, 1440]) {
    assert.ok(script.includes(String(width)), `missing responsive QA width ${width}`);
  }
  assert.match(script, /ORSIRA/);
  assert.match(script, /noBodyOverflow/);
  assert.match(script, /aria-label="Mobiele navigatie"|Mobiele navigatie/);
  assert.match(script, /Hoofdnavigatie/);
  assert.match(script, /focus\(\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
