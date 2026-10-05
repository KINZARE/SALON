import test from "node:test";
import assert from "node:assert/strict";
import { buildIntakePublicPath, normalizeIntakeSignature } from "../src/domain/intake-signature.ts";

test("typed intake signatures are trimmed and required",()=>{
  assert.equal(normalizeIntakeSignature("  Kwin Phetmanee  "),"Kwin Phetmanee");
  assert.throws(()=>normalizeIntakeSignature("   "),/SIGNATURE_REQUIRED/);
  assert.throws(()=>normalizeIntakeSignature("x".repeat(161)),/INVALID_SIGNATURE/);
});

test("intake public path is deterministic and QR-safe",()=>{
  const token="a".repeat(48);
  assert.equal(buildIntakePublicPath(token),`/intake/${token}`);
  assert.throws(()=>buildIntakePublicPath("short"),/INVALID_INTAKE_TOKEN/);
});
