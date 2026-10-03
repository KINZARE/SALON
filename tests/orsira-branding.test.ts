import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const read = (path: string) => fs.readFile(path, "utf8");

test("ORSIRA global brand tokens and fonts replace the legacy SALON foundation", async () => {
  const [css, layout] = await Promise.all([
    read("src/app/globals.css"),
    read("src/app/layout.tsx"),
  ]);

  for (const token of ["#ffffff", "#faf7f2", "#d9d4cc", "#2b2b2b", "#7b3f46", "#a7b89f"]) {
    assert.ok(css.toLowerCase().includes(token), `missing ORSIRA token ${token}`);
  }
  assert.ok(!css.toLowerCase().includes("#e7fe55"), "legacy lime token must be removed");
  assert.ok(!css.toLowerCase().includes("#bfe8ec"), "legacy cyan token must be removed");
  assert.ok(!css.includes("radial-gradient"), "app body must not use decorative radial gradients");
  assert.match(css, /font-family:\s*var\(--font-inter\)/);
  assert.match(css, /\.font-display/);

  assert.match(layout, /import\s*\{\s*Inter\s*,\s*Playfair_Display\s*\}\s*from\s*"next\/font\/google"/);
  assert.match(layout, /--font-inter/);
  assert.match(layout, /--font-playfair/);
  assert.match(layout, /default:\s*"ORSIRA"/);
  assert.ok(!layout.includes('default: "SALON"'));
});
