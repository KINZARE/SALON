import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionAppointment, assertAppointmentTransition } from "../src/domain/appointment-status.ts";

test("allows normal operational flow", () => {
  assert.equal(canTransitionAppointment("pending", "confirmed"), true);
  assert.equal(canTransitionAppointment("confirmed", "checked_in"), true);
  assert.equal(canTransitionAppointment("checked_in", "completed"), true);
});

test("does not reopen terminal states", () => {
  assert.equal(canTransitionAppointment("completed", "confirmed"), false);
  assert.throws(() => assertAppointmentTransition("cancelled", "confirmed"));
});
