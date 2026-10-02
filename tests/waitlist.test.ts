import test from "node:test";
import assert from "node:assert/strict";
import { waitlistEntryMatchesGap } from "../src/domain/waitlist.ts";

const base={
  gapDate:"2026-10-02",
  gapStaffId:"staff-a",
  gapDurationMinutes:75,
  windowStart:"2026-10-02",
  windowEnd:"2026-10-02",
  preferredStaffId:null as string|null,
  eligibleStaffIds:["staff-a","staff-b"],
  serviceDurationMinutes:60,
  bufferMinutes:15,
};

test("waitlist matches when date, staff eligibility and occupied duration fit",()=>{
  assert.equal(waitlistEntryMatchesGap(base),true);
});

test("preferred staff must match the free gap",()=>{
  assert.equal(waitlistEntryMatchesGap({...base,preferredStaffId:"staff-b"}),false);
});

test("service plus buffer must fit inside the free gap",()=>{
  assert.equal(waitlistEntryMatchesGap({...base,gapDurationMinutes:74}),false);
});

test("gap date must fall inside the requested window",()=>{
  assert.equal(waitlistEntryMatchesGap({...base,gapDate:"2026-10-03"}),false);
});
