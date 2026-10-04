import test from "node:test";
import assert from "node:assert/strict";
import { buildCompletionFollowUpJobs } from "../src/domain/follow-up-jobs.ts";

test("completion follow-up jobs schedule feedback and optional rebook deterministically",()=>{
  const jobs=buildCompletionFollowUpJobs({
    appointmentId:"11111111-1111-4111-8111-111111111111",
    completedAt:"2026-10-04T12:00:00.000Z",
    recipient:"klant@example.nl",
    rebookAfterDays:42,
  });
  assert.deepEqual(jobs.map(job=>({kind:job.kind,nextAttemptAt:job.nextAttemptAt,idempotencyKey:job.idempotencyKey})),[
    {kind:"feedback_request",nextAttemptAt:"2026-10-05T12:00:00.000Z",idempotencyKey:"feedback_request/11111111-1111-4111-8111-111111111111"},
    {kind:"rebook_reminder",nextAttemptAt:"2026-11-15T12:00:00.000Z",idempotencyKey:"rebook_reminder/11111111-1111-4111-8111-111111111111"},
  ]);
});

test("completion follow-up jobs omit rebook when policy or recipient is unavailable",()=>{
  assert.deepEqual(buildCompletionFollowUpJobs({
    appointmentId:"11111111-1111-4111-8111-111111111111",
    completedAt:"2026-10-04T12:00:00.000Z",
    recipient:"",
    rebookAfterDays:null,
  }),[]);
});

test("completion follow-up jobs reject invalid rebook intervals",()=>{
  assert.throws(()=>buildCompletionFollowUpJobs({
    appointmentId:"11111111-1111-4111-8111-111111111111",
    completedAt:"2026-10-04T12:00:00.000Z",
    recipient:"klant@example.nl",
    rebookAfterDays:0,
  }),/INVALID_REBOOK_INTERVAL/);
});
