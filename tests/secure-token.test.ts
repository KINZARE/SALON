import test from "node:test";
import assert from "node:assert/strict";
import { generateSecureToken, hashSecureToken, isSecureTokenActive } from "../src/domain/secure-token.ts";

test("self-service tokens are random url-safe secrets",()=>{
  const a=generateSecureToken();
  const b=generateSecureToken();
  assert.notEqual(a,b);
  assert.match(a,/^[A-Za-z0-9_-]{40,}$/);
  assert.match(b,/^[A-Za-z0-9_-]{40,}$/);
});

test("token hashing is deterministic and does not retain the raw token",()=>{
  const token="known_self_service_token";
  const first=hashSecureToken(token);
  const second=hashSecureToken(token);
  assert.equal(first,second);
  assert.notEqual(first,token);
  assert.match(first,/^[a-f0-9]{64}$/);
});

test("expired or revoked tokens are inactive",()=>{
  const now=new Date("2026-10-02T08:00:00.000Z");
  assert.equal(isSecureTokenActive({expiresAt:"2026-10-03T08:00:00.000Z",revokedAt:null,now}),true);
  assert.equal(isSecureTokenActive({expiresAt:"2026-10-02T07:59:59.000Z",revokedAt:null,now}),false);
  assert.equal(isSecureTokenActive({expiresAt:"2026-10-03T08:00:00.000Z",revokedAt:"2026-10-02T07:00:00.000Z",now}),false);
});
