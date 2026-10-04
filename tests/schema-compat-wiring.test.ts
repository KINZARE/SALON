import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("PR A transitional reads do not probe missing additive columns before migration",async()=>{
  const [workspace,product,intake,waitlist]=await Promise.all([
    fs.readFile("src/services/workspace-data.ts","utf8"),
    fs.readFile("src/services/product-completion.ts","utf8"),
    fs.readFile("src/services/intake.ts","utf8"),
    fs.readFile("src/services/waitlist.ts","utf8"),
  ]);
  assert.match(workspace,/from\("services"\)\s*\.select\("\*"\)/);
  assert.doesNotMatch(workspace,/select\("[^\"]*rebook_after_days[^\"]*"\)/);
  assert.match(product,/from\("intake_form_fields"\)\.select\("\*"\)/);
  assert.doesNotMatch(product,/select\("[^\"]*condition[^\"]*"\)/);
  assert.match(intake,/from\("intake_form_fields"\)\.select\("\*"\)/);
  assert.match(intake,/legacySubmissionResult/);
  assert.match(intake,/p_consent_accepted:consentAccepted\s*\}\);/);
  assert.match(waitlist,/offer:null/);
});
