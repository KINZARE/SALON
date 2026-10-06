import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const read = (path: string) => fs.readFile(path, "utf8");
const exists = async (path: string) => fs.access(path).then(() => true).catch(() => false);

test("ORSIRA brand foundation uses the light green-accented sans-serif system", async () => {
  const [css, layout] = await Promise.all([read("src/app/globals.css"), read("src/app/layout.tsx")]);

  for (const token of [
    "#fbfcf8",
    "#ffffff",
    "#f2f5ef",
    "#171a17",
    "#626a63",
    "#e1e7de",
    "#1b241d",
    "#58c96d",
    "#eaf8ed",
  ]) {
    assert.ok(css.toLowerCase().includes(token), `missing ORSIRA Bukuna-inspired token ${token}`);
  }

  assert.ok(!css.toLowerCase().includes("#7b3f46"), "legacy burgundy must be removed from the brand foundation");
  assert.ok(!css.includes("radial-gradient"));
  assert.match(css, /font-family:\s*var\(--font-inter\)/);
  assert.match(css, /\.font-display[\s\S]*var\(--font-manrope\)/);
  assert.match(layout, /Inter/);
  assert.match(layout, /Manrope/);
  assert.ok(!layout.includes("Playfair_Display"));
  assert.match(layout, /--font-inter/);
  assert.match(layout, /--font-manrope/);
  assert.match(layout, /default:\s*"ORSIRA"/);
});

test("shared UI primitives preserve APIs while adopting the new controls", async () => {
  const [button, field, emptyState, statusChip] = await Promise.all([
    read("src/components/ui/button.tsx"),
    read("src/components/ui/field.tsx"),
    read("src/components/ui/empty-state.tsx"),
    read("src/components/ui/status-chip.tsx"),
  ]);

  assert.match(button, /variant\?:\s*"primary"\s*\|\s*"secondary"\s*\|\s*"ghost"\s*\|\s*"danger"\s*\|\s*"accent"/);
  assert.match(button, /export function Button/);
  assert.match(button, /primary:\s*"[^"]*bg-\[var\(--primary\)\][^"]*text-white/);
  assert.match(button, /accent:\s*"[^"]*bg-\[var\(--secondary\)\][^"]*text-\[var\(--ink\)\]/);
  assert.match(button, /rounded-\[10px\]/);
  assert.match(button, /disabled:opacity-50/);
  assert.match(field, /export function Field/);
  assert.match(field, /export function TextAreaField/);
  assert.match(field, /focus:border-\[var\(--secondary\)\]/);
  assert.match(field, /focus:ring-\[var\(--secondary-soft\)\]/);
  assert.match(emptyState, /export function EmptyState/);
  assert.match(statusChip, /export function StatusChip/);
});

test("marketing root and pricing route expose the ORSIRA website without authenticated app context", async () => {
  assert.equal(await exists("src/app/pricing/page.tsx"), true, "pricing information route must exist");
  const [home, pricing] = await Promise.all([read("src/app/page.tsx"), read("src/app/pricing/page.tsx")]);

  assert.ok(!home.includes("redirect(\"/app/today\")"));
  assert.match(home, /ORSIRA/);
  assert.match(home, /Meer rust in je salon/);
  assert.match(home, /data-orsira-product-preview/);
  assert.match(home, /href="\/pricing"/);
  assert.match(home, /href="\/login"/);
  assert.ok(!home.includes("requireAppContext"));

  assert.match(pricing, /ORSIRA/);
  assert.match(pricing, /Prijs voor jouw salon/);
  assert.match(pricing, /data-pricing-information/);
  assert.match(pricing, /href="\/login"/);
});

test("app shell keeps role-aware routes and uses green as a deliberate accent", async () => {
  const [nav, appLayout, search] = await Promise.all([
    read("src/components/app-shell/nav.tsx"),
    read("src/app/app/layout.tsx"),
    read("src/components/app-shell/operational-search.tsx"),
  ]);

  assert.match(nav, />ORSIRA</);
  assert.ok(!nav.includes(">SALON<"));
  assert.match(appLayout, />ORSIRA</);
  for (const route of ["/app/today", "/app/calendar", "/app/customers", "/app/more"]) {
    assert.ok(nav.includes(route), `navigation route must remain: ${route}`);
  }
  assert.match(nav, /role === "staff"/);
  const more = await read("src/app/app/more/page.tsx");
  for (const route of ["/app/services", "/app/staff", "/app/reports", "/app/settings"]) assert.ok(more.includes(route));
  assert.match(nav, /bg-\[var\(--secondary-soft\)\]/);
  assert.match(nav, /bg-\[var\(--secondary\)\]/);
  assert.match(search, /focus:border-\[var\(--primary\)\]/);
});

test("calendar presentation keeps drag, rollback and mobile contracts intact", async () => {
  const [board, mobile] = await Promise.all([
    read("src/components/workspace/calendar-board.tsx"),
    read("src/components/workspace/mobile-calendar-timeline.tsx"),
  ]);

  assert.match(board, /data-appointment-id/);
  assert.match(board, /data-drop-staff/);
  assert.match(board, /data-staff-identity/);
  assert.match(board, /data-current-time-line/);
  assert.match(board, /\/api\/internal\/move/);
  assert.match(board, /setLocalAppointments/);
  assert.match(board, /router\.refresh\(\)/);
  assert.match(mobile, /data-mobile-calendar/);
});

test("critical operational and customer-facing surfaces remain wired to existing behavior", async () => {
  const [today, appointment, bookingPage, smartPage, embedPage, bookingFlow, smartFlow, selfService] = await Promise.all([
    read("src/components/workspace/daily/daily-workspace.tsx"),
    read("src/app/app/appointments/[id]/page.tsx"),
    read("src/app/book/[salonSlug]/page.tsx"),
    read("src/app/book-link/[token]/page.tsx"),
    read("src/app/embed/[salonSlug]/page.tsx"),
    read("src/components/booking/booking-flow.tsx"),
    read("src/components/booking/smart-booking-flow.tsx"),
    read("src/components/booking/customer-self-service-manager.tsx"),
  ]);

  assert.match(today, /data-orsira-next-appointment/);
  assert.match(appointment, /data-appointment-action-centre/);
  assert.match(appointment, /transitionAppointmentStatus/);
  assert.match(appointment, /updateAppointmentNote/);
  assert.match(bookingPage, /<BookingFlow/);
  assert.match(smartPage, /<SmartBookingFlow/);
  assert.match(embedPage, /<BookingFlow/);
  for (const source of [bookingPage, smartPage, embedPage]) assert.match(source, /ORSIRA/);
  for (const source of [bookingFlow, smartFlow, selfService]) assert.ok(!source.includes("SALON"));
});
