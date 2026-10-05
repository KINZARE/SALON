import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Today is wired to server-side KPI and capacity truth", () => {
  const workspace = source("src/services/today-workspace.ts");
  assert.match(workspace, /calculateAppointmentKpis/);
  assert.match(workspace, /computeCapacitySummary/);
  assert.match(workspace, /bookableMinutes/);
  assert.match(workspace, /occupiedMinutes/);
  assert.match(workspace, /freeCapacityMinutes/);
  assert.match(workspace, /occupancyPercent/);
});

test("Today summary exposes a calm operational KPI hierarchy", () => {
  const summary = source("src/components/workspace/today-summary.tsx");
  for (const label of ["afspraken", "geplande waarde", "bezet"]) assert.ok(summary.includes(label));
  assert.doesNotMatch(summary, /grid-cols|Vrije capaciteit|Aandacht nodig/);
  assert.doesNotMatch(summary, /overflow-x-auto|carousel/i);
});

test("Reports uses explicit value and rate language instead of misleading revenue or retention labels", () => {
  const reports = source("src/app/app/reports/page.tsx");
  assert.doesNotMatch(reports, /omzet afgerond/i);
  assert.doesNotMatch(reports, /terugkeerpercentage/i);
  assert.match(reports, /Afgeronde behandelwaarde/);
  assert.match(reports, /Annuleringspercentage/);
  assert.match(reports, /No-showpercentage/);
});

test("Calendar workspace is labelled Agenda without replacing its route or engine", () => {
  const calendar = source("src/app/app/calendar/page.tsx");
  assert.match(calendar, />Agenda</);
  assert.match(calendar, /CalendarDayView/);
});
