import test from "node:test";
import assert from "node:assert/strict";
import {
  PREVIEW_DEMO,
  getDemoAppointmentsForDate,
  getDemoAvailability,
  getDemoAppointment,
} from "../src/demo/preview-data.ts";

test("preview demo exposes realistic salon, service, staff and customer data", () => {
  assert.equal(PREVIEW_DEMO.salon.slug, "baan-thai-demo");
  assert.equal(PREVIEW_DEMO.services[0]?.name, "Thai Massage 60 min");
  assert.equal(PREVIEW_DEMO.services[0]?.price_cents, 6500);
  assert.equal(PREVIEW_DEMO.staff[0]?.name, "Nok");
  assert.ok(PREVIEW_DEMO.customers.length >= 3);
});

test("preview calendar produces appointments for the requested date", () => {
  const rows = getDemoAppointmentsForDate("2026-10-02");
  assert.ok(rows.length >= 3);
  assert.ok(rows.every((row) => row.starts_at.startsWith("2026-10-02")));
  assert.ok(rows.some((row) => row.service_name_snapshot === "Thai Massage 60 min"));
});

test("preview availability supports no preference and a selected staff member", () => {
  const all = getDemoAvailability("2026-10-03");
  assert.ok(all.length >= 4);
  assert.ok(all.every((slot) => slot.staffIds.length >= 1));
  const nokOnly = getDemoAvailability("2026-10-03", PREVIEW_DEMO.staff[0]!.id);
  assert.ok(nokOnly.length >= 4);
  assert.ok(nokOnly.every((slot) => slot.staffIds.length === 1 && slot.staffIds[0] === PREVIEW_DEMO.staff[0]!.id));
});

test("preview booking confirmation resolves to a click-through appointment detail", () => {
  const appointment = getDemoAppointment(PREVIEW_DEMO.bookedAppointmentId);
  assert.ok(appointment);
  assert.equal(appointment?.customer_name_snapshot, "Sophie de Vries");
  assert.equal(appointment?.price_cents_snapshot, 6500);
});
