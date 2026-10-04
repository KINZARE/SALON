import test from "node:test";
import assert from "node:assert/strict";
import "./helpers/server-imports.mjs";
const { parseUnambiguousLocalDateTime } = await import("../src/domain/local-time.ts");

test("accepts a normal Europe/Amsterdam local time", () => {
  const value = parseUnambiguousLocalDateTime("2026-10-01T14:30", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-10-01T12:30:00.000Z");
});

test("rejects nonexistent local time during DST spring forward", () => {
  assert.equal(parseUnambiguousLocalDateTime("2026-03-29T02:30", "Europe/Amsterdam"), null);
});

test("rejects ambiguous local time during DST fall back", () => {
  assert.equal(parseUnambiguousLocalDateTime("2026-10-25T02:30", "Europe/Amsterdam"), null);
});

test("rejects malformed local date-time input", () => {
  assert.equal(parseUnambiguousLocalDateTime("2026-10-01 14:30", "Europe/Amsterdam"), null);
});

test("accepts the last minute before DST spring forward", () => {
  const value = parseUnambiguousLocalDateTime("2026-03-29T01:59", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-03-29T00:59:00.000Z");
});

test("accepts the first minute after DST spring forward", () => {
  const value = parseUnambiguousLocalDateTime("2026-03-29T03:00", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-03-29T01:00:00.000Z");
});

test("rejects the first nonexistent minute in the spring DST gap", () => {
  assert.equal(parseUnambiguousLocalDateTime("2026-03-29T02:00", "Europe/Amsterdam"), null);
});

test("accepts the last minute before the repeated fall-back hour", () => {
  const value = parseUnambiguousLocalDateTime("2026-10-25T01:59", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-10-24T23:59:00.000Z");
});

test("accepts the first unambiguous minute after DST fall back", () => {
  const value = parseUnambiguousLocalDateTime("2026-10-25T03:00", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-10-25T02:00:00.000Z");
});

test("rejects the first ambiguous minute in the fall-back hour", () => {
  assert.equal(parseUnambiguousLocalDateTime("2026-10-25T02:00", "Europe/Amsterdam"), null);
});

test("accepts a local midnight boundary", () => {
  const value = parseUnambiguousLocalDateTime("2026-01-15T00:00", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-01-14T23:00:00.000Z");
});

test("accepts the final minute before local midnight", () => {
  const value = parseUnambiguousLocalDateTime("2026-01-15T23:59", "Europe/Amsterdam");
  assert.ok(value);
  assert.equal(value.toISOString(), "2026-01-15T22:59:00.000Z");
});

test("invalid timezones and impossible dates reject safely",()=>{
  assert.equal(parseUnambiguousLocalDateTime("2026-10-01T14:30","Invalid/Zone"),null);
  assert.equal(parseUnambiguousLocalDateTime("2026-02-30T14:30","Europe/Amsterdam"),null);
  assert.equal(parseUnambiguousLocalDateTime("2026-10-01T24:00","Europe/Amsterdam"),null);
});


test("handles non-hour DST transitions with explicit rejection",()=>{
  assert.equal(parseUnambiguousLocalDateTime("2026-10-04T02:15","Australia/Lord_Howe"),null);
  assert.equal(parseUnambiguousLocalDateTime("2026-04-05T01:45","Australia/Lord_Howe"),null);
  assert.equal(parseUnambiguousLocalDateTime("2026-10-04T02:30","Australia/Lord_Howe")?.toISOString(),"2026-10-03T15:30:00.000Z");
});
