import test from "node:test";
import assert from "node:assert/strict";
import { computeStaffGaps } from "../src/domain/day-capacity.ts";

const d=(iso:string)=>new Date(iso);

test("breaks, blocks and active appointments split working capacity", () => {
  const gaps = computeStaffGaps({
    working: [{ start:d("2026-10-02T07:00:00.000Z"), end:d("2026-10-02T16:00:00.000Z") }],
    breaks: [{ start:d("2026-10-02T10:00:00.000Z"), end:d("2026-10-02T10:30:00.000Z") }],
    blocks: [{ start:d("2026-10-02T13:00:00.000Z"), end:d("2026-10-02T14:00:00.000Z") }],
    appointments: [
      { start:d("2026-10-02T08:00:00.000Z"), end:d("2026-10-02T09:00:00.000Z"), status:"confirmed" },
      { start:d("2026-10-02T11:00:00.000Z"), end:d("2026-10-02T12:00:00.000Z"), status:"checked_in" },
    ],
  });
  assert.deepEqual(gaps.map(g=>[g.start.toISOString(),g.end.toISOString(),g.durationMinutes]),[
    ["2026-10-02T07:00:00.000Z","2026-10-02T08:00:00.000Z",60],
    ["2026-10-02T09:00:00.000Z","2026-10-02T10:00:00.000Z",60],
    ["2026-10-02T10:30:00.000Z","2026-10-02T11:00:00.000Z",30],
    ["2026-10-02T12:00:00.000Z","2026-10-02T13:00:00.000Z",60],
    ["2026-10-02T14:00:00.000Z","2026-10-02T16:00:00.000Z",120],
  ]);
});

test("cancelled and no-show appointments do not consume capacity", () => {
  const gaps = computeStaffGaps({
    working: [{ start:d("2026-10-02T09:00:00.000Z"), end:d("2026-10-02T12:00:00.000Z") }],
    breaks: [],
    blocks: [],
    appointments: [
      { start:d("2026-10-02T09:00:00.000Z"), end:d("2026-10-02T10:00:00.000Z"), status:"cancelled" },
      { start:d("2026-10-02T10:00:00.000Z"), end:d("2026-10-02T11:00:00.000Z"), status:"no_show" },
    ],
  });
  assert.deepEqual(gaps.map(g=>g.durationMinutes),[180]);
});

test("adjacent busy intervals merge and short gaps are hidden by default", () => {
  const gaps = computeStaffGaps({
    working: [{ start:d("2026-10-02T09:00:00.000Z"), end:d("2026-10-02T12:00:00.000Z") }],
    breaks: [],
    blocks: [],
    appointments: [
      { start:d("2026-10-02T09:30:00.000Z"), end:d("2026-10-02T10:00:00.000Z"), status:"confirmed" },
      { start:d("2026-10-02T10:00:00.000Z"), end:d("2026-10-02T11:45:00.000Z"), status:"confirmed" },
    ],
  });
  assert.deepEqual(gaps.map(g=>g.durationMinutes),[30]);
});
