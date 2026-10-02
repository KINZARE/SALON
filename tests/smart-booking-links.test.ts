import test from "node:test";
import assert from "node:assert/strict";
import { isDateWithinBookingLink, validateBookingLinkWindow } from "../src/domain/booking-link.ts";

test("booking link date window accepts inclusive boundaries",()=>{
  assert.equal(isDateWithinBookingLink("2026-10-03","2026-10-03","2026-10-05"),true);
  assert.equal(isDateWithinBookingLink("2026-10-05","2026-10-03","2026-10-05"),true);
  assert.equal(isDateWithinBookingLink("2026-10-06","2026-10-03","2026-10-05"),false);
});

test("booking link window is valid, ordered and intentionally short",()=>{
  assert.deepEqual(validateBookingLinkWindow("2026-10-03","2026-10-05"),{startDate:"2026-10-03",endDate:"2026-10-05"});
  assert.throws(()=>validateBookingLinkWindow("2026-10-05","2026-10-03"),/INVALID_BOOKING_LINK_WINDOW/);
  assert.throws(()=>validateBookingLinkWindow("2026-10-01","2026-11-30"),/BOOKING_LINK_WINDOW_TOO_LARGE/);
});
