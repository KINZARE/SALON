import test from "node:test";
import assert from "node:assert/strict";
import { getDraggedTargetMinute, shiftAppointmentTimes } from "../src/domain/calendar-drag.ts";

test("drag distance snaps to the nearest 15 minute slot", () => {
  assert.equal(getDraggedTargetMinute({
    originalMinute: 9 * 60,
    deltaY: 17,
    pxPerMinute: 1,
    stepMinutes: 15,
    startMinute: 8 * 60,
    endMinute: 18 * 60,
    occupiedMinutes: 45,
  }), 9 * 60 + 15);

  assert.equal(getDraggedTargetMinute({
    originalMinute: 9 * 60,
    deltaY: 8,
    pxPerMinute: 1,
    stepMinutes: 15,
    startMinute: 8 * 60,
    endMinute: 18 * 60,
    occupiedMinutes: 45,
  }), 9 * 60 + 15);
});

test("drag target is clamped inside the visible planning window", () => {
  assert.equal(getDraggedTargetMinute({
    originalMinute: 9 * 60,
    deltaY: -500,
    pxPerMinute: 1,
    stepMinutes: 15,
    startMinute: 8 * 60,
    endMinute: 18 * 60,
    occupiedMinutes: 60,
  }), 8 * 60);

  assert.equal(getDraggedTargetMinute({
    originalMinute: 17 * 60 + 30,
    deltaY: 200,
    pxPerMinute: 1,
    stepMinutes: 15,
    startMinute: 8 * 60,
    endMinute: 18 * 60,
    occupiedMinutes: 60,
  }), 17 * 60);
});

test("optimistic move shifts all appointment timestamps by the same amount", () => {
  assert.deepEqual(
    shiftAppointmentTimes({
      startsAt: "2026-10-02T08:00:00.000Z",
      serviceEndsAt: "2026-10-02T08:45:00.000Z",
      occupiedUntil: "2026-10-02T09:00:00.000Z",
      deltaMinutes: 30,
    }),
    {
      startsAt: "2026-10-02T08:30:00.000Z",
      serviceEndsAt: "2026-10-02T09:15:00.000Z",
      occupiedUntil: "2026-10-02T09:30:00.000Z",
    },
  );
});
