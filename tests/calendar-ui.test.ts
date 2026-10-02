import test from "node:test";
import assert from "node:assert/strict";
import { getAppointmentVisual, getStatusMeta } from "../src/lib/calendar-ui.ts";

test("appointment status semantics are functional and restrained", () => {
  assert.deepEqual(getStatusMeta("pending"), { label: "In afwachting", tone: "warning" });
  assert.deepEqual(getStatusMeta("confirmed"), { label: "Bevestigd", tone: "success" });
  assert.deepEqual(getStatusMeta("checked_in"), { label: "In salon", tone: "info" });
  assert.deepEqual(getStatusMeta("completed"), { label: "Afgerond", tone: "complete" });
  assert.deepEqual(getStatusMeta("cancelled"), { label: "Geannuleerd", tone: "muted" });
  assert.deepEqual(getStatusMeta("no_show"), { label: "No-show", tone: "danger" });
});

test("appointment visual semantics do not depend on service-name keywords", () => {
  const a = getAppointmentVisual("confirmed", "00000000-0000-4000-8000-000000000001");
  const b = getAppointmentVisual("confirmed", "00000000-0000-4000-8000-000000000001");
  assert.deepEqual(a, b);
  assert.equal(a.surfaceTone, "neutral");
  assert.equal(a.statusTone, "success");
});
