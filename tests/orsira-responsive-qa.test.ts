import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("ORSIRA responsive QA covers required viewports, overflow, brand and focus", async () => {
  const [script, css] = await Promise.all([
    fs.readFile("scripts/orsira-responsive-qa.mjs", "utf8"),
    fs.readFile("src/app/globals.css", "utf8"),
  ]);

  for (const width of [320, 375, 390, 430, 768, 1440]) assert.ok(script.includes(String(width)), `missing responsive QA width ${width}`);
  assert.match(script, /ORSIRA/);
  assert.match(script, /noBodyOverflow/);
  assert.match(script, /aria-label="Mobiele navigatie"|Mobiele navigatie/);
  assert.match(script, /Hoofdnavigatie/);
  assert.match(script, /focus\(\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("Smart Booking Link controls can shrink to a 320px viewport", async () => {
  const source = await fs.readFile("src/components/workspace/smart-booking-link-creator.tsx", "utf8");
  assert.match(source, /className="grid min-w-0 gap-4 sm:grid-cols-2"/);
  assert.ok((source.match(/w-full min-w-0/g) ?? []).length >= 4, "service, staff and both date controls must be shrink-safe");
  assert.match(source, /rounded-\[16px\] border border-\[var\(--border\)\] bg-white/);
});
