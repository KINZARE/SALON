import test from "node:test";
import assert from "node:assert/strict";
import { parseUnambiguousLocalDateTime } from "../src/domain/local-time.ts";

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
