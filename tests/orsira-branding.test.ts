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

test("Today supporting surfaces and day controls use restrained ORSIRA styling", async () => {
  const [timeline, attention, quickActions, dayView] = await Promise.all([
    read("src/components/workspace/today-timeline.tsx"),
    read("src/components/workspace/attention-list.tsx"),
    read("src/components/workspace/quick-actions.tsx"),
    read("src/components/workspace/calendar-day-view.tsx"),
  ]);
  assert.ok(!timeline.includes("rounded-[24px]"));
  assert.ok(!timeline.includes("rounded-[22px]"));
  assert.ok(!attention.includes("rounded-[20px]"));
  assert.match(quickActions, /bg-\[var\(--primary\)\][^\n"]*text-white/);
  assert.ok(!quickActions.includes("bg-[var(--ink)] text-white"));
  assert.match(dayView, /bg-\[var\(--primary\)\][^\n"]*text-white/);
  assert.ok(!dayView.includes("bg-[var(--ink)]"));
});

test("Calendar presentation is ORSIRA while drag and rollback contracts remain intact", async () => {
  const [board, period, overviews, mobile] = await Promise.all([
    read("src/components/workspace/calendar-board.tsx"),
    read("src/components/workspace/calendar-period-view.tsx"),
    read("src/components/workspace/calendar-overviews.tsx"),
    read("src/components/workspace/mobile-calendar-timeline.tsx"),
  ]);
  assert.match(board, /data-appointment-id/);
  assert.match(board, /data-drop-staff/);
  assert.match(board, /data-staff-identity/);
  assert.match(board, /data-current-time-line/);
  assert.match(board, /\/api\/internal\/move/);
  assert.match(board, /setLocalAppointments/);
  assert.match(board, /router\.refresh\(\)/);
  assert.match(board, /bg-\[var\(--primary\)\][^\n"]*text-white/);
  assert.ok(!board.includes("bg-[var(--ink)]"));
  assert.ok(!period.includes("bg-[var(--ink)]"));
  assert.ok(!overviews.includes("rounded-[18px]"));
  assert.match(mobile, /data-mobile-calendar/);
});

test("management surfaces use restrained ORSIRA rows and actions", async () => {
  const [customers, services, staff] = await Promise.all([read("src/app/app/customers/page.tsx"), read("src/app/app/services/page.tsx"), read("src/app/app/staff/page.tsx")]);
  assert.match(customers, />Klanten</); assert.match(customers, /bg-\[var\(--primary\)\][^\n"]*text-white/); assert.match(customers, /rounded-\[10px\]/);
  assert.ok(!services.includes("rounded-[22px]")); assert.ok(!services.includes("bg-[var(--ink)]")); assert.match(services, /bg-\[var\(--primary\)\]/);
  assert.ok(!staff.includes("rounded-[22px]")); assert.match(staff, /rounded-\[16px\]/); assert.match(staff, /text-\[var\(--primary\)\]/);
});

test("secondary management surfaces are compact and use ORSIRA primary actions", async () => {
  const [detail, blocks, waitlist, intake, schedule, widget, bookingLinks, more, search] = await Promise.all([
    read("src/app/app/customers/[id]/page.tsx"),
    read("src/app/app/blocks/page.tsx"),
    read("src/app/app/waitlist/page.tsx"),
    read("src/app/app/intake/page.tsx"),
    read("src/app/app/settings/schedule/page.tsx"),
    read("src/app/app/settings/widget/page.tsx"),
    read("src/app/app/booking-links/page.tsx"),
    read("src/app/app/more/page.tsx"),
    read("src/app/app/search/page.tsx"),
  ]);
  for (const source of [detail, blocks, waitlist, intake, schedule, widget, bookingLinks, more, search]) {
    assert.ok(!source.includes("bg-[var(--ink)]"));
    assert.ok(!source.includes("rounded-[24px]"));
    assert.ok(!source.includes("rounded-[22px]"));
  }
  for (const source of [detail, waitlist, schedule, widget]) assert.match(source, /bg-\[var\(--primary\)\]/);
  assert.match(widget, /ORSIRA zelf/);
});

test("management editors use the same restrained ORSIRA primitives", async () => {
  const [serviceEditor, staffEditor, intakeEditor, widgetCode] = await Promise.all([
    read("src/components/workspace/service-editor.tsx"),
    read("src/components/workspace/staff-editor.tsx"),
    read("src/components/workspace/intake-form-editor.tsx"),
    read("src/components/workspace/widget-code-block.tsx"),
  ]);
  for (const source of [serviceEditor, staffEditor, intakeEditor, widgetCode]) {
    assert.ok(!source.includes("rounded-[22px]"));
    assert.ok(!source.includes("bg-[var(--ink)]"));
    assert.match(source, /rounded-\[16px\]/);
  }
  assert.match(serviceEditor, /data-service-editor/);
  assert.match(staffEditor, /data-staff-editor/);
});

test("Reports and settings use ORSIRA hierarchy instead of charcoal primary controls", async () => {
  const [reports, settings] = await Promise.all([read("src/app/app/reports/page.tsx"), read("src/app/app/settings/page.tsx")]);
  assert.ok(!reports.includes("bg-[var(--ink)]"));
  assert.ok(!reports.includes("rounded-[22px]"));
  assert.match(reports, /bg-\[var\(--primary\)\][^\n"]*text-white/);
  assert.ok(!settings.includes("rounded-[24px]"));
  assert.ok(!settings.includes("rounded-[22px]"));
  assert.match(settings, /rounded-\[16px\]/);
});

test("appointment action centre is light ORSIRA and preserves existing operations", async () => {
  const appointment = await read("src/app/app/appointments/[id]/page.tsx");
  assert.match(appointment, /data-appointment-action-centre/);
  assert.ok(!appointment.includes("rounded-[28px] bg-[var(--ink)]"));
  assert.ok(!appointment.includes("bg-[var(--ink)] px-4 text-sm font-medium text-white"));
  assert.match(appointment, /bg-\[var\(--primary\)\][^\n"]*text-white/);
  assert.match(appointment, /transitionAppointmentStatus/);
  assert.match(appointment, /updateAppointmentNote/);
});

test("customer-facing booking surfaces visibly carry ORSIRA without changing flow components", async () => {
  const [bookingPage, smartPage, embedPage, errorPage, bookingFlow, smartFlow, selfService, managePage, publicIntake] = await Promise.all([
    read("src/app/book/[salonSlug]/page.tsx"),
    read("src/app/book-link/[token]/page.tsx"),
    read("src/app/embed/[salonSlug]/page.tsx"),
    read("src/app/app/error.tsx"),
    read("src/components/booking/booking-flow.tsx"),
    read("src/components/booking/smart-booking-flow.tsx"),
    read("src/components/booking/customer-self-service-manager.tsx"),
    read("src/app/manage/[token]/page.tsx"),
    read("src/app/intake/[token]/page.tsx"),
  ]);
  for (const source of [bookingPage, smartPage, embedPage, managePage, publicIntake]) assert.match(source, /ORSIRA/);
  assert.match(bookingPage, /<BookingFlow/); assert.match(smartPage, /<SmartBookingFlow/); assert.match(embedPage, /<BookingFlow/);
  assert.ok(!smartPage.includes(">SALON<")); assert.ok(!managePage.includes(">SALON<")); assert.match(bookingPage, /rounded-\[16px\]/);
  assert.match(errorPage, /<Button/); assert.match(errorPage, /font-display/);
  for (const source of [bookingFlow, smartFlow, selfService]) {
    assert.match(source, /bg-\[var\(--primary\)\]/);
    assert.ok(!source.includes("bg-[var(--ink)]"));
  }
});
