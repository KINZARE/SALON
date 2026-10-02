import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell, resolveReportRange } from "../src/domain/reporting.ts";

test("CSV cells neutralize spreadsheet formulas", () => {
  assert.equal(escapeCsvCell("=1+1"), "'=1+1");
  assert.equal(escapeCsvCell("+SUM(A1:A2)"), "'+SUM(A1:A2)");
  assert.equal(escapeCsvCell("-2+3"), "'-2+3");
  assert.equal(escapeCsvCell("@cmd"), "'@cmd");
  assert.equal(escapeCsvCell("Normal"), "Normal");
});

test("custom report range rejects invalid ranges", () => {
  assert.throws(() => resolveReportRange({ preset:"custom", from:"2026-10-10", to:"2026-10-01", today:"2026-10-02" }));
  assert.throws(() => resolveReportRange({ preset:"custom", from:"2024-01-01", to:"2026-10-01", today:"2026-10-02" }));
});

test("last30 includes today and 29 previous days", () => {
  assert.deepEqual(resolveReportRange({preset:"last30", today:"2026-10-02"}), {from:"2026-09-03",to:"2026-10-02",toExclusive:"2026-10-03"});
});
