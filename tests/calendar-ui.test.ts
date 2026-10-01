import test from "node:test";
import assert from "node:assert/strict";
import { getAppointmentTone, getStatusMeta } from "../src/lib/calendar-ui.ts";

test("terminal appointment statuses have explicit calendar tones", () => {
  assert.equal(getAppointmentTone("Balayage", "no_show"), "danger");
  assert.equal(getAppointmentTone("Balayage", "cancelled"), "muted");
  assert.equal(getAppointmentTone("Balayage", "completed"), "success");
});

test("active services get a deterministic pastel tone", () => {
  assert.equal(getAppointmentTone("Balayage", "confirmed"), getAppointmentTone("Balayage", "confirmed"));
  assert.notEqual(getAppointmentTone("Balayage", "confirmed"), getAppointmentTone("Heren knippen", "confirmed"));
});

test("status metadata uses human-readable Dutch labels", () => {
  assert.deepEqual(getStatusMeta("pending"), { label: "In afwachting", tone: "warning" });
  assert.deepEqual(getStatusMeta("confirmed"), { label: "Bevestigd", tone: "info" });
  assert.deepEqual(getStatusMeta("completed"), { label: "Afgerond", tone: "success" });
  assert.deepEqual(getStatusMeta("no_show"), { label: "No-show", tone: "danger" });
});
