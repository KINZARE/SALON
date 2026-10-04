import test from "node:test";
import assert from "node:assert/strict";
import "./helpers/server-imports.mjs";
import { resolveReportRange } from "../src/domain/reporting.ts";

const { serializeReportCsv } = await import("../src/services/report-csv.ts");
const escapeCsvCell = (value: unknown) => serializeReportCsv([[value]]).slice(1);

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

test("CSV neutralizes tab and CR formula prefixes",()=>{
  assert.equal(escapeCsvCell("\t=SUM(A1:A2)"),"'\t=SUM(A1:A2)");
  assert.equal(escapeCsvCell("\r=SUM(A1:A2)"),'"\'\r=SUM(A1:A2)"');
});


test("CSV preserves Excel BOM column order CRLF Unicode and escaped cells",()=>{
  assert.equal(serializeReportCsv([["Klant","Notitie","Leeg"],["Zoë, Émile",'Hij zei "ja"',null],["Málaga","regel1\nregel2",""]]),'\uFEFFKlant,Notitie,Leeg\r\n"Zoë, Émile","Hij zei ""ja""",\r\nMálaga,"regel1\nregel2",');
  assert.equal(serializeReportCsv([["=SUM(A1:A2)","+1","-2","@cmd"]]),"\uFEFF'=SUM(A1:A2),'+1,'-2,'@cmd");
  assert.equal(serializeReportCsv([["a\r\nb"]]),'\uFEFF"a\r\nb"');
});
