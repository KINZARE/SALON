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

test("shared UI primitives use the restrained ORSIRA control language without API changes", async () => {
  const [button, field, emptyState, statusChip] = await Promise.all([
    read("src/components/ui/button.tsx"),
    read("src/components/ui/field.tsx"),
    read("src/components/ui/empty-state.tsx"),
    read("src/components/ui/status-chip.tsx"),
  ]);

  assert.match(button, /variant\?:\s*"primary"\s*\|\s*"secondary"\s*\|\s*"ghost"\s*\|\s*"danger"\s*\|\s*"accent"/);
  assert.match(button, /export function Button/);
  assert.match(button, /primary:\s*"[^"]*bg-\[var\(--primary\)\][^"]*text-white/);
  assert.match(button, /rounded-\[10px\]/);
  assert.match(button, /disabled:opacity-50/);

  assert.match(field, /export function Field/);
  assert.match(field, /export function TextAreaField/);
  assert.match(field, /rounded-\[10px\]/);
  assert.match(field, /focus:border-\[var\(--primary\)\]/);
  assert.match(field, /focus:ring-\[var\(--primary-soft\)\]/);

  assert.match(emptyState, /export function EmptyState/);
  assert.match(emptyState, /rounded-\[10px\]/);
  assert.match(statusChip, /export function StatusChip/);

  for (const source of [button, field, emptyState, statusChip]) {
    assert.ok(!source.toLowerCase().includes("#e7fe55"));
    assert.ok(!source.toLowerCase().includes("#bfe8ec"));
  }
});
