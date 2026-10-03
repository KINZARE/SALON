import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const read = (path: string) => fs.readFile(path, "utf8");

test("ORSIRA global brand tokens and fonts replace the legacy SALON foundation", async () => {
  const [css, layout] = await Promise.all([read("src/app/globals.css"), read("src/app/layout.tsx")]);
  for (const token of ["#ffffff", "#faf7f2", "#d9d4cc", "#2b2b2b", "#7b3f46", "#a7b89f"]) assert.ok(css.toLowerCase().includes(token), `missing ORSIRA token ${token}`);
  assert.ok(!css.toLowerCase().includes("#e7fe55")); assert.ok(!css.toLowerCase().includes("#bfe8ec")); assert.ok(!css.includes("radial-gradient"));
  assert.match(css, /font-family:\s*var\(--font-inter\)/); assert.match(css, /\.font-display/);
  assert.match(layout, /import\s*\{\s*Inter\s*,\s*Playfair_Display\s*\}\s*from\s*"next\/font\/google"/); assert.match(layout, /--font-inter/); assert.match(layout, /--font-playfair/); assert.match(layout, /default:\s*"ORSIRA"/); assert.ok(!layout.includes('default: "SALON"'));
});

test("shared UI primitives use the restrained ORSIRA control language without API changes", async () => {
  const [button, field, emptyState, statusChip] = await Promise.all([read("src/components/ui/button.tsx"), read("src/components/ui/field.tsx"), read("src/components/ui/empty-state.tsx"), read("src/components/ui/status-chip.tsx")]);
  assert.match(button, /variant\?:\s*"primary"\s*\|\s*"secondary"\s*\|\s*"ghost"\s*\|\s*"danger"\s*\|\s*"accent"/); assert.match(button, /export function Button/); assert.match(button, /primary:\s*"[^"]*bg-\[var\(--primary\)\][^"]*text-white/); assert.match(button, /rounded-\[10px\]/); assert.match(button, /disabled:opacity-50/);
  assert.match(field, /export function Field/); assert.match(field, /export function TextAreaField/); assert.match(field, /rounded-\[10px\]/); assert.match(field, /focus:border-\[var\(--primary\)\]/); assert.match(field, /focus:ring-\[var\(--primary-soft\)\]/);
  assert.match(emptyState, /export function EmptyState/); assert.match(emptyState, /rounded-\[10px\]/); assert.match(statusChip, /export function StatusChip/);
  for (const source of [button, field, emptyState, statusChip]) { assert.ok(!source.toLowerCase().includes("#e7fe55")); assert.ok(!source.toLowerCase().includes("#bfe8ec")); }
});

test("app shell shows ORSIRA while preserving role-aware navigation routes", async () => {
  const [nav, appLayout, search] = await Promise.all([read("src/components/app-shell/nav.tsx"), read("src/app/app/layout.tsx"), read("src/components/app-shell/operational-search.tsx")]);
  assert.match(nav, />ORSIRA</); assert.ok(!nav.includes(">SALON<")); assert.match(appLayout, />ORSIRA</);
  for (const route of ["/app/today", "/app/calendar", "/app/customers", "/app/services", "/app/staff", "/app/reports", "/app/settings", "/app/more"]) assert.ok(nav.includes(route), `navigation route must remain: ${route}`);
  assert.match(nav, /role === "staff"/); assert.match(nav, /bg-\[var\(--primary-soft\)\]/); assert.match(nav, /text-\[var\(--primary\)\]/); assert.ok(!nav.includes("bg-[var(--ink)] text-white")); assert.match(search, /rounded-\[10px\]/); assert.match(search, /focus:border-\[var\(--primary\)\]/);
});

test("Today and Calendar use a light ORSIRA operational hierarchy", async () => {
  const [today, summary, calendar] = await Promise.all([read("src/app/app/today/page.tsx"), read("src/components/workspace/today-summary.tsx"), read("src/app/app/calendar/page.tsx")]);
  assert.match(today, /data-orsira-next-appointment/); assert.ok(!today.includes("rounded-[30px] bg-[var(--ink)] text-white")); assert.match(today, /border border-\[var\(--border\)\] bg-white/);
  assert.match(summary, /rounded-\[16px\]/); assert.ok(!summary.includes("rounded-[24px]")); assert.match(calendar, /bg-\[var\(--primary-soft\)\] text-\[var\(--primary\)\]/); assert.match(calendar, /bg-\[var\(--primary\)\][^\n"]*text-white/); assert.ok(!calendar.includes("bg-[var(--ink)] text-white"));
});

test("management surfaces use restrained ORSIRA rows and actions", async () => {
  const [customers, services, staff] = await Promise.all([read("src/app/app/customers/page.tsx"), read("src/app/app/services/page.tsx"), read("src/app/app/staff/page.tsx")]);
  assert.match(customers, />Klanten</); assert.match(customers, /bg-\[var\(--primary\)\][^\n"]*text-white/); assert.match(customers, /rounded-\[10px\]/);
  assert.ok(!services.includes("rounded-[22px]"), "Services must avoid oversized card rounding"); assert.ok(!services.includes("bg-[var(--ink)]"), "Services primary actions must use ORSIRA burgundy"); assert.match(services, /bg-\[var\(--primary\)\]/);
  assert.ok(!staff.includes("rounded-[22px]"), "Staff must avoid oversized card rounding"); assert.match(staff, /rounded-\[16px\]/); assert.match(staff, /text-\[var\(--primary\)\]/);
});
