import test from "node:test";
import assert from "node:assert/strict";
import { normalizePaymentPolicy } from "../src/domain/payment-policy.ts";

test("pay in salon does not keep a deposit amount",()=>{
  assert.deepEqual(normalizePaymentPolicy({mode:"pay_in_salon",depositCents:2500,priceCents:6500}),{
    mode:"pay_in_salon",
    depositCents:null,
  });
});

test("fixed deposit must be positive and not exceed service price",()=>{
  assert.deepEqual(normalizePaymentPolicy({mode:"deposit",depositCents:2000,priceCents:6500}),{
    mode:"deposit",
    depositCents:2000,
  });
  assert.throws(()=>normalizePaymentPolicy({mode:"deposit",depositCents:0,priceCents:6500}),/INVALID_DEPOSIT/);
  assert.throws(()=>normalizePaymentPolicy({mode:"deposit",depositCents:7000,priceCents:6500}),/INVALID_DEPOSIT/);
});

test("full payment is server-owned and does not need deposit cents",()=>{
  assert.deepEqual(normalizePaymentPolicy({mode:"full_payment",depositCents:1000,priceCents:6500}),{
    mode:"full_payment",
    depositCents:null,
  });
});
