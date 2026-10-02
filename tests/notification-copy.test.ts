import test from "node:test";
import assert from "node:assert/strict";
import { buildNotificationMessage, retryDelayMinutes } from "../src/domain/notification-copy.ts";

const input={
  salonName:"SALON Studio Amsterdam",
  customerName:"Tess de Wit",
  serviceName:"Knippen & stylen",
  startsAt:"2026-10-03T12:00:00.000Z",
  timezone:"Europe/Amsterdam",
};

test("booking confirmation copy contains the booked local time",()=>{
  const message=buildNotificationMessage({...input,kind:"booking_confirmation"});
  assert.equal(message.subject,"Je afspraak bij SALON Studio Amsterdam is bevestigd");
  assert.match(message.text,/Tess de Wit/);
  assert.match(message.text,/3 oktober 2026/);
  assert.match(message.text,/14:00/);
  assert.match(message.text,/Knippen & stylen/);
});

test("24 hour reminder copy is clearly a reminder",()=>{
  const message=buildNotificationMessage({...input,kind:"appointment_reminder"});
  assert.equal(message.subject,"Herinnering voor je afspraak bij SALON Studio Amsterdam");
  assert.match(message.text,/herinnering/i);
  assert.match(message.text,/14:00/);
});

test("retry delay backs off without growing forever",()=>{
  assert.deepEqual([1,2,3,4,9].map(retryDelayMinutes),[5,15,60,240,240]);
});
