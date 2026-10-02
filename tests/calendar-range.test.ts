import test from "node:test";
import assert from "node:assert/strict";
import { getMonthGrid, getWeekDates } from "../src/domain/calendar-range.ts";

test("week range is Monday through Sunday around selected date", () => {
  assert.deepEqual(getWeekDates("2026-10-02"), ["2026-09-28","2026-09-29","2026-09-30","2026-10-01","2026-10-02","2026-10-03","2026-10-04"]);
});

test("October 2026 month grid uses complete Monday-Sunday weeks", () => {
  const grid = getMonthGrid("2026-10-02");
  assert.equal(grid[0], "2026-09-28");
  assert.equal(grid.at(-1), "2026-11-01");
  assert.equal(grid.length, 35);
});
