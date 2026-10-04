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

import { shiftCalendarDate } from "../src/domain/calendar-range.ts";
import { resolveReportRange } from "../src/domain/reporting.ts";
test("calendar dates preserve leap year year boundary and DST date-only semantics",()=>{
  assert.equal(shiftCalendarDate("2024-02-28",1),"2024-02-29");
  assert.equal(shiftCalendarDate("2024-02-29",1),"2024-03-01");
  assert.equal(shiftCalendarDate("2026-12-31",1),"2027-01-01");
  assert.equal(shiftCalendarDate("2026-03-28",1),"2026-03-29");
  assert.equal(shiftCalendarDate("2026-10-24",1),"2026-10-25");
  assert.deepEqual(getWeekDates("2026-10-04"),getWeekDates("2026-09-28"));
  assert.equal(getMonthGrid("2024-02-15").at(-1),"2024-03-03");
  assert.deepEqual(resolveReportRange({preset:"previous_month",today:"2026-01-01"}),{from:"2025-12-01",to:"2025-12-31",toExclusive:"2026-01-01"});
  assert.deepEqual(resolveReportRange({preset:"this_month",today:"2024-02-29"}),{from:"2024-02-01",to:"2024-02-29",toExclusive:"2024-03-01"});
  assert.throws(()=>getWeekDates("2026-02-30"));
});
