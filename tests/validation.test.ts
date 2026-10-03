import test from "node:test";
import assert from "node:assert/strict";
import { isIsoDate, isUuid } from "../src/lib/validation.ts";

test("calendar dates reject rollover and malformed values", () => {
  for (const value of ["2026-02-30", "2025-02-29", "2026-13-01", "2026-1-01", "", null]) assert.equal(isIsoDate(value), false);
  assert.equal(isIsoDate("2024-02-29"), true);
});
test("UUID validation preserves supported versions and variants", () => {
  assert.equal(isUuid("123e4567-e89b-12d3-a456-426614174000"), true);
  for (const value of ["invalid", "123e4567-e89b-72d3-a456-426614174000", "123e4567-e89b-12d3-0456-426614174000", null]) assert.equal(isUuid(value), false);
});

import { PublicBookingSchema, WaitlistSchema, ServiceSchema, CustomerSchema, ReportRangeSchema, MoneyInputSchema, BookingLinkSchema, CalendarMoveSchema } from "../src/lib/schemas.ts";
import { validateIntakeDefinition, validateIntakeAnswers } from "../src/domain/intake-form.ts";
const id="123e4567-e89b-12d3-a456-426614174000";
const customer={name:"Klant",phone:"+31 6 12345678",email:"test@example.com"};
const booking={serviceId:id,staffId:null,startsAt:"2026-10-04T10:00:00+02:00",customer};
test("calendar move rejects malformed objects before time resolution",()=>{
  for(const payload of [null,[],{}, {appointmentId:id,staffId:"invalid"}])assert.equal(CalendarMoveSchema.safeParse(payload).success,false);
  assert.deepEqual(CalendarMoveSchema.parse({appointmentId:id,staffId:id,localStart:"2026-10-04T10:00"}),{appointmentId:id,staffId:id,localStart:"2026-10-04T10:00",expectedStartsAt:null,expectedStaffId:null});
});
test("public booking rejects malformed payloads and contacts",()=>{
  assert.equal(PublicBookingSchema.safeParse(booking).success,true);
  for(const payload of [null,[],{}, {...booking,startsAt:"invalid"},{...booking,serviceId:"x"},{...booking,customer:null},{...booking,customer:{...customer,email:"wrong"}},{...booking,customer:{...customer,phone:"12"}}]) assert.equal(PublicBookingSchema.safeParse(payload).success,false);
});
test("optional internal contact rules and text normalization remain intact",()=>{
  assert.deepEqual(CustomerSchema.parse({name:" Test ",phone:"",email:"",note:" note "}),{name:"Test",phone:null,email:null,note:"note"});
  assert.equal(CustomerSchema.safeParse({name:"X",email:"invalid"}).success,false);
  assert.equal(CustomerSchema.parse({name:" X".repeat(100)}).name.length,160);
  assert.equal(WaitlistSchema.safeParse({serviceId:id,date:"2026-10-04",customer:{name:"X".repeat(161),email:"x@example.com"}}).success,false);
});
test("service numeric shape rejects invalid duration price buffer and deposit",()=>{
  const service={id:null,name:"Behandeling",categoryId:null,duration:60,buffer:0,priceCents:4500,depositCents:null,staffIds:[id],paymentMode:"pay_in_salon"};
  assert.equal(ServiceSchema.safeParse(service).success,true);
  for(const change of [{duration:4},{duration:5.5},{duration:721},{buffer:-1},{priceCents:-1},{priceCents:NaN},{depositCents:-1},{staffIds:["invalid"]}])assert.equal(ServiceSchema.safeParse({...service,...change}).success,false);
  assert.equal(MoneyInputSchema.parse("45,50"),4550);
  for(const value of ["NaN","Infinity","-1"])assert.equal(MoneyInputSchema.safeParse(value).success,false);
});
test("waitlist and booking links reject malformed dates and payloads",()=>{
  assert.equal(WaitlistSchema.safeParse({serviceId:id,date:"2026-10-04",customer:{name:"X",email:"x@example.com"}}).success,true);
  for(const payload of [null,[],{serviceId:id,date:"2026-02-30",customer},{serviceId:id,date:"2026-10-04",customer:{name:"X"}}])assert.equal(WaitlistSchema.safeParse(payload).success,false);
  assert.equal(BookingLinkSchema.safeParse({serviceId:id,startDate:"2026-02-30",endDate:"2026-10-10"}).success,false);
});
test("intake schema safely rejects malformed fields and impossible answer dates",()=>{
  for(const fields of [null,[null],[{label:"X",type:"select",required:false,options:[2]}]])assert.throws(()=>validateIntakeDefinition({title:"Test",fields:fields as never}));
  assert.throws(()=>validateIntakeAnswers([{id,type:"date",required:true}],{[id]:"2026-02-30"}));
});
test("report schema rejects malformed preset and impossible dates",()=>{
  for(const payload of [{preset:"wrong",today:"2026-10-04"},{preset:"custom",today:"2026-10-04",from:"2026-02-30",to:"2026-03-01"}])assert.equal(ReportRangeSchema.safeParse(payload).success,false);
});
