import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("PR A services keep legacy schema readable until additive migrations are activated",async()=>{
  const [workspace,product,intake,waitlist]=await Promise.all([
    fs.readFile("src/services/workspace-data.ts","utf8"),
    fs.readFile("src/services/product-completion.ts","utf8"),
    fs.readFile("src/services/intake.ts","utf8"),
    fs.readFile("src/services/waitlist.ts","utf8"),
  ]);
  for(const source of [workspace,product,intake,waitlist])assert.match(source,/isMissingSchemaFeatureError/);
  assert.match(workspace,/rebook_after_days:null/);
  assert.match(product,/condition:null/);
  assert.match(intake,/condition:undefined/);
  assert.match(waitlist,/offer:null/);
});
