import test from "node:test";
import assert from "node:assert/strict";
import { getStaffIdentity } from "../src/lib/staff-identity.ts";

test("staff identity is stable for the same staff id", () => {
  const first = getStaffIdentity("00000000-0000-4000-8000-000000000001", "Nok S.");
  const second = getStaffIdentity("00000000-0000-4000-8000-000000000001", "Nok S.");
  assert.deepEqual(first, second);
  assert.equal(first.initials, "NS");
});

test("staff identity keeps colour subtle and deterministic across people", () => {
  const nok = getStaffIdentity("00000000-0000-4000-8000-000000000001", "Nok");
  const mali = getStaffIdentity("00000000-0000-4000-8000-000000000002", "Mali");
  assert.notEqual(nok.tone, mali.tone);
  assert.match(nok.tone, /^(clay|sage|sand|sky|lilac)$/);
});
