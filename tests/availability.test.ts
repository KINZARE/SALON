import test from "node:test";
import assert from "node:assert/strict";
import { computeAvailability } from "../src/domain/availability.ts";

const at = (time: string) => new Date(`2026-10-02T${time}:00.000Z`);

test("only returns slots that fit service + buffer", () => {
  const slots = computeAvailability({
    serviceDurationMinutes: 60,
    bufferMinutes: 15,
    slotIntervalMinutes: 15,
    staff: [{
      staffId: "nok",
      salonOpen: [{ start: at("09:00"), end: at("10:00") }],
      staffWorking: [{ start: at("09:00"), end: at("10:00") }],
      breaks: [], blocks: [], appointments: [],
    }],
  });
  assert.equal(slots.length, 0);
});

test("blocks overlapping appointment including buffer", () => {
  const slots = computeAvailability({
    serviceDurationMinutes: 60,
    bufferMinutes: 15,
    slotIntervalMinutes: 15,
    staff: [{
      staffId: "nok",
      salonOpen: [{ start: at("09:00"), end: at("13:00") }],
      staffWorking: [{ start: at("09:00"), end: at("13:00") }],
      breaks: [], blocks: [],
      appointments: [{ start: at("10:00"), end: at("11:15") }],
    }],
  });
  const times = slots.map((slot) => slot.start.toISOString().slice(11, 16));
  assert.deepEqual(times, ["11:15", "11:30", "11:45"]);
});

test("no preference merges the same time across valid staff", () => {
  const common = {
    salonOpen: [{ start: at("09:00"), end: at("11:00") }],
    staffWorking: [{ start: at("09:00"), end: at("11:00") }],
    breaks: [], blocks: [], appointments: [],
  };
  const slots = computeAvailability({
    serviceDurationMinutes: 60,
    bufferMinutes: 0,
    slotIntervalMinutes: 60,
    staff: [
      { staffId: "nok", ...common },
      { staffId: "mali", ...common },
    ],
  });
  assert.deepEqual(slots[0]?.staffIds, ["mali", "nok"]);
});

test("breaks remove only overlapping candidate slots", () => {
  const slots = computeAvailability({
    serviceDurationMinutes: 30,
    bufferMinutes: 0,
    slotIntervalMinutes: 30,
    staff: [{
      staffId: "nok",
      salonOpen: [{ start: at("09:00"), end: at("12:00") }],
      staffWorking: [{ start: at("09:00"), end: at("12:00") }],
      breaks: [{ start: at("10:00"), end: at("10:30") }],
      blocks: [], appointments: [],
    }],
  });
  assert.ok(!slots.some((slot) => slot.start.getTime() === at("10:00").getTime()));
  assert.ok(slots.some((slot) => slot.start.getTime() === at("10:30").getTime()));
});

test("slot grid is anchored to the local working window instead of UTC epoch", () => {
  const start = new Date("2026-10-02T03:30:00.000Z");
  const end = new Date("2026-10-02T05:00:00.000Z");
  const slots = computeAvailability({
    serviceDurationMinutes: 20,
    bufferMinutes: 0,
    slotIntervalMinutes: 20,
    staff: [{
      staffId: "staff-a",
      salonOpen: [{ start, end }],
      staffWorking: [{ start, end }],
      breaks: [], blocks: [], appointments: [],
    }],
  });
  assert.deepEqual(slots.slice(0, 3).map((slot) => slot.start.toISOString().slice(11,16)), ["03:30", "03:50", "04:10"]);
});

test("minStart advances to the next slot on the working-window grid", () => {
  const slots = computeAvailability({
    serviceDurationMinutes: 30,
    bufferMinutes: 0,
    slotIntervalMinutes: 15,
    minStart: at("09:07"),
    staff: [{
      staffId: "nok",
      salonOpen: [{ start: at("09:00"), end: at("11:00") }],
      staffWorking: [{ start: at("09:00"), end: at("11:00") }],
      breaks: [], blocks: [], appointments: [],
    }],
  });
  assert.equal(slots[0]?.start.toISOString().slice(11,16), "09:15");
});

test("adjacent appointment boundaries remain bookable", () => {
  const slots = computeAvailability({
    serviceDurationMinutes: 30,
    bufferMinutes: 0,
    slotIntervalMinutes: 30,
    staff: [{
      staffId: "nok",
      salonOpen: [{ start: at("09:00"), end: at("12:00") }],
      staffWorking: [{ start: at("09:00"), end: at("12:00") }],
      breaks: [], blocks: [],
      appointments: [{ start: at("09:30"), end: at("10:00") }],
    }],
  });
  const times = slots.map((slot) => slot.start.toISOString().slice(11,16));
  assert.ok(times.includes("09:00"));
  assert.ok(times.includes("10:00"));
  assert.ok(!times.includes("09:30"));
});
