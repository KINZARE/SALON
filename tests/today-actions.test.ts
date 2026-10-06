import test from 'node:test';
import assert from 'node:assert/strict';
import {getDailyPrimaryAction,selectCurrentNext,validateDailyMutation} from '../src/domain/today-actions.ts';
const appointment=(id:string,status:string,start:string,started:string|null=null)=>({id,status,starts_at:start,service_ends_at:'2026-10-06T13:00:00Z',treatment_started_at:started,payment_status:'unpaid'});
test('daily primary action progresses only from persisted server state',()=>{
 assert.deepEqual(getDailyPrimaryAction(appointment('a','pending','2026-10-06T10:00:00Z')),{label:'Inchecken',action:'check_in'});
 assert.deepEqual(getDailyPrimaryAction(appointment('a','confirmed','2026-10-06T10:00:00Z')),{label:'Inchecken',action:'check_in'});
 assert.deepEqual(getDailyPrimaryAction(appointment('a','checked_in','2026-10-06T10:00:00Z')),{label:'Start behandeling',action:'start'});
 assert.deepEqual(getDailyPrimaryAction(appointment('a','checked_in','2026-10-06T10:00:00Z','2026-10-06T10:05:00Z')),{label:'Afronden',action:'finish'});
 for(const status of ['completed','cancelled','no_show'])assert.equal(getDailyPrimaryAction(appointment('a',status,'2026-10-06T10:00:00Z')),null);
});
test('current and next ignore terminal states, sort unsorted input and retain late arrivals',()=>{
 const a=appointment('next','confirmed','2026-10-06T14:00:00Z');
 const b=appointment('current','checked_in','2026-10-06T10:00:00Z','2026-10-06T10:05:00Z');
 const c=appointment('late','confirmed','2026-10-06T11:00:00Z');
 const terminal=appointment('done','completed','2026-10-06T09:00:00Z');
 assert.deepEqual(selectCurrentNext([a,terminal,c,b],new Date('2026-10-06T12:00:00Z')),{current:b,next:c});
 assert.deepEqual(selectCurrentNext([],new Date()),{current:null,next:null});
 assert.equal(selectCurrentNext([a,terminal],new Date('2026-10-06T12:00:00Z')).next,a);
});
test('daily mutation validates UUID, action, snapshots and bounded notes',()=>{
 const valid={appointmentId:'12345678-1234-4123-8123-123456789abc',action:'note',expectedStatus:'confirmed',expectedStartedAt:null,expectedNote:'old',note:'new'};
 assert.ok(validateDailyMutation(valid));
 for(const input of [{...valid,appointmentId:'other'},{...valid,action:'paid'},{...valid,note:'a'.repeat(1001)},{...valid,expectedStartedAt:'bad'}, {...valid,expectedStatus:'fake'}, {...valid,expectedNote:undefined}, null])assert.equal(validateDailyMutation(input),null);
});
test('a scheduled treatment covering now is current before check-in',()=>{
 const current={...appointment('current','confirmed','2026-10-06T10:00:00Z'),service_ends_at:'2026-10-06T11:00:00Z'};
 const next=appointment('next','confirmed','2026-10-06T12:00:00Z');
 assert.deepEqual(selectCurrentNext([next,current],new Date('2026-10-06T10:30:00Z')),{current,next});
});
