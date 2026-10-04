import test from "node:test";
import assert from "node:assert/strict";
import { validateWaitlistOffer } from "../src/domain/waitlist-offer.ts";

const base={
  waitlistEntryId:"11111111-1111-4111-8111-111111111111",
  serviceId:"22222222-2222-4222-8222-222222222222",
  staffId:"33333333-3333-4333-8333-333333333333",
  startsAt:"2026-10-08T10:00:00.000Z",
  endsAt:"2026-10-08T11:00:00.000Z",
  expiresAt:"2026-10-07T10:00:00.000Z",
};

test("waitlist offer validates a bounded future slot without creating booking data",()=>{
  const offer=validateWaitlistOffer(base,"2026-10-04T12:00:00.000Z");
  assert.deepEqual(offer,base);
  assert.equal("appointmentId" in offer,false);
});

test("waitlist offer rejects invalid slot and expiry ranges",()=>{
  assert.throws(()=>validateWaitlistOffer({...base,endsAt:base.startsAt},"2026-10-04T12:00:00.000Z"),/INVALID_OFFER_RANGE/);
  assert.throws(()=>validateWaitlistOffer({...base,expiresAt:"2026-10-04T11:59:00.000Z"},"2026-10-04T12:00:00.000Z"),/INVALID_OFFER_EXPIRY/);
  assert.throws(()=>validateWaitlistOffer({...base,expiresAt:"2026-10-08T10:01:00.000Z"},"2026-10-04T12:00:00.000Z"),/INVALID_OFFER_EXPIRY/);
});
