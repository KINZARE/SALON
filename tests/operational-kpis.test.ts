import test from "node:test";
import assert from "node:assert/strict";

const reporting = await import("../src/domain/reporting.ts");
const capacity = await import("../src/domain/day-capacity.ts");

type KpiRow = { status: string; price_cents_snapshot: number };
type CustomerRow = { customer_id: string; status: string };
type CapacityInterval = { start: Date; end: Date };
type CapacityAppointment = CapacityInterval & { status: string };

test("appointment KPI summary uses explicit status semantics", () => {
  const calculate = (reporting as typeof reporting & {
    calculateAppointmentKpis?: (rows: KpiRow[]) => {
      appointments: number;
      plannedValueCents: number;
      completed: number;
      completedValueCents: number;
      averageCompletedValueCents: number;
      cancellations: number;
      cancellationRate: number;
      noShows: number;
      noShowRate: number;
    };
  }).calculateAppointmentKpis;

  assert.equal(typeof calculate, "function", "calculateAppointmentKpis must exist");
  if (!calculate) return;

  const summary = calculate([
    { status: "confirmed", price_cents_snapshot: 10_000 },
    { status: "no_show", price_cents_snapshot: 5_000 },
    { status: "cancelled", price_cents_snapshot: 7_000 },
    { status: "completed", price_cents_snapshot: 8_000 },
  ]);

  assert.deepEqual(summary, {
    appointments: 3,
    plannedValueCents: 23_000,
    completed: 1,
    completedValueCents: 8_000,
    averageCompletedValueCents: 8_000,
    cancellations: 1,
    cancellationRate: 25,
    noShows: 1,
    noShowRate: 50,
  });
});

test("appointment KPI rates are zero-safe", () => {
  const calculate = (reporting as typeof reporting & { calculateAppointmentKpis?: (rows: KpiRow[]) => Record<string, number> }).calculateAppointmentKpis;
  assert.equal(typeof calculate, "function", "calculateAppointmentKpis must exist");
  if (!calculate) return;

  const summary = calculate([]);
  assert.equal(summary.cancellationRate, 0);
  assert.equal(summary.noShowRate, 0);
  assert.equal(summary.averageCompletedValueCents, 0);
});

test("customer mix ignores cancelled and no-show rows as visit history", () => {
  const calculate = (reporting as typeof reporting & {
    calculateCustomerMix?: (rows: CustomerRow[], returningBeforePeriod: Set<string>) => { newCustomers: number; returningCustomers: number };
  }).calculateCustomerMix;
  assert.equal(typeof calculate, "function", "calculateCustomerMix must exist");
  if (!calculate) return;

  const summary = calculate([
    { customer_id: "new-completed", status: "completed" },
    { customer_id: "returning-confirmed", status: "confirmed" },
    { customer_id: "cancelled-only", status: "cancelled" },
    { customer_id: "no-show-only", status: "no_show" },
    { customer_id: "new-completed", status: "confirmed" },
  ], new Set(["returning-confirmed", "cancelled-only", "no-show-only"]));

  assert.deepEqual(summary, { newCustomers: 1, returningCustomers: 1 });
});

test("capacity summary subtracts breaks and blocks and includes buffers and no-shows", () => {
  const calculate = (capacity as typeof capacity & {
    computeCapacitySummary?: (input: {
      working: CapacityInterval[];
      breaks: CapacityInterval[];
      blocks: CapacityInterval[];
      appointments: CapacityAppointment[];
    }) => { bookableMinutes: number; occupiedMinutes: number; freeMinutes: number; occupancyPercent: number };
  }).computeCapacitySummary;

  assert.equal(typeof calculate, "function", "computeCapacitySummary must exist");
  if (!calculate) return;

  const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 4, hour, minute));
  const summary = calculate({
    working: [{ start: at(9), end: at(17) }],
    breaks: [{ start: at(12), end: at(13) }],
    blocks: [{ start: at(15), end: at(15, 30) }],
    appointments: [
      { start: at(9), end: at(10), status: "confirmed" },
      { start: at(10), end: at(11, 15), status: "completed" },
      { start: at(11, 15), end: at(12), status: "cancelled" },
      { start: at(13), end: at(14), status: "no_show" },
    ],
  });

  assert.deepEqual(summary, {
    bookableMinutes: 390,
    occupiedMinutes: 195,
    freeMinutes: 195,
    occupancyPercent: 50,
  });
});

test("capacity summary clips appointments to bookable time and does not double count overlaps", () => {
  const calculate = (capacity as typeof capacity & {
    computeCapacitySummary?: (input: {
      working: CapacityInterval[];
      breaks: CapacityInterval[];
      blocks: CapacityInterval[];
      appointments: CapacityAppointment[];
    }) => { bookableMinutes: number; occupiedMinutes: number; freeMinutes: number; occupancyPercent: number };
  }).computeCapacitySummary;

  assert.equal(typeof calculate, "function", "computeCapacitySummary must exist");
  if (!calculate) return;

  const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 4, hour, minute));
  const summary = calculate({
    working: [{ start: at(9), end: at(12) }],
    breaks: [{ start: at(10), end: at(10, 30) }],
    blocks: [],
    appointments: [
      { start: at(8, 30), end: at(9, 30), status: "confirmed" },
      { start: at(9, 15), end: at(10, 45), status: "confirmed" },
      { start: at(11, 30), end: at(12, 30), status: "checked_in" },
    ],
  });

  assert.deepEqual(summary, {
    bookableMinutes: 150,
    occupiedMinutes: 105,
    freeMinutes: 45,
    occupancyPercent: 70,
  });
});
