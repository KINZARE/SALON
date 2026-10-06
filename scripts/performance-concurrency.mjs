import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const tenant = randomUUID(), staff = randomUUID(), service = randomUUID();
const slug = `qa-perf-${tenant}`;
const results = [];
const checked = async query => { const result = await query; if (result.error) throw result.error; return result.data; };
const today = formatInTimeZone(new Date(), 'Europe/Amsterdam', 'yyyy-MM-dd');
const day = offset => new Date(Date.parse(`${today}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
const at = (date, hour) => fromZonedTime(`${date}T${String(hour).padStart(2, '0')}:00:00`, 'Europe/Amsterdam').toISOString();
const book = (date, hour, staffId = staff) => db.rpc('create_appointment_atomic', {
  p_salon_id: tenant, p_service_id: service, p_staff_id: staffId, p_starts_at: at(date, hour),
  p_customer_name: 'Isolated concurrency fixture', p_source: 'public_booking',
  // No contact details: these tests cannot send confirmation/reminder messages.
});
async function race(name, first, second, allowedErrors) {
  const pair = await Promise.all([first, second]);
  assert.equal(pair.filter(r => !r.error).length, 1, `${name}: exactly one conflicting mutation must commit`);
  const error = pair.find(r => r.error).error;
  assert.ok(allowedErrors.includes(error.message) || allowedErrors.includes(error.code), `${name}: unexpected rejection ${error.code} ${error.message}`);
  results.push({ name, committed: 1, rejected: 1, rejection: error.code });
  return pair;
}
try {
  await checked(db.from('salons').insert({ id: tenant, slug, name: 'Isolated performance QA' }));
  await checked(db.from('staff').insert({ id: staff, salon_id: tenant, name: 'QA staff' }));
  await checked(db.from('services').insert({ id: service, salon_id: tenant, name: 'QA service', duration_minutes: 60, buffer_minutes: 15, price_cents: 6500 }));
  await checked(db.from('staff_services').insert({ salon_id: tenant, staff_id: staff, service_id: service }));
  await checked(db.from('booking_settings').insert({ salon_id: tenant, min_lead_minutes: 0, max_days_ahead: 365 }));
  await checked(db.from('opening_hours').insert(Array.from({ length: 7 }, (_, weekday) => ({ salon_id: tenant, weekday, is_open: true, start_time: '09:00', end_time: '20:00' }))));
  await checked(db.from('staff_schedules').insert(Array.from({ length: 7 }, (_, weekday) => ({ salon_id: tenant, staff_id: staff, weekday, is_working: true, start_time: '09:00', end_time: '20:00' }))));
  for (let repeat = 0; repeat < 3; repeat++) {
    const base = 2 + repeat * 9;
    await race('booking vs booking', book(day(base), 10), book(day(base), 10), ['23P01']);
    await race('booking vs block', book(day(base + 1), 10), db.rpc('save_workspace_entity', { p_salon_id: tenant, p_kind: 'block', p_payload: { staff_id: staff, starts_at: at(day(base + 1), 10), ends_at: at(day(base + 1), 12), reason: 'Isolated QA block' } }), ['TIME_BLOCKED', 'APPOINTMENTS_IN_BLOCK']);
    await race('booking vs schedule exception', book(day(base + 2), 10), db.rpc('save_opening_exception', { p_salon_id: tenant, p_date: day(base + 2), p_is_open: false }), ['SALON_CLOSED', 'APPOINTMENTS_IN_SCHEDULE']);
    const appointment = await checked(book(day(base + 3), 10));
    await race('reschedule vs booking', db.rpc('move_workspace_appointment', { p_id: appointment, p_staff_id: staff, p_starts_at: at(day(base + 3), 15), p_expected_starts_at: at(day(base + 3), 10), p_expected_staff_id: staff }), book(day(base + 3), 15), ['23P01']);
    const staleAppointment = await checked(book(day(base + 4), 10));
    const stale = target => db.rpc('move_workspace_appointment', { p_id: staleAppointment, p_staff_id: staff, p_starts_at: at(day(base + 4), target), p_expected_starts_at: at(day(base + 4), 10), p_expected_staff_id: staff });
    await race('stale drag/drop', stale(14), stale(16), ['STALE_APPOINTMENT']);
    const snapshot = await checked(db.from('appointments').select('duration_minutes_snapshot,buffer_minutes_snapshot,price_cents_snapshot').eq('id', staleAppointment).eq('salon_id', tenant).single());
    assert.deepEqual(snapshot, { duration_minutes_snapshot: 60, buffer_minutes_snapshot: 15, price_cents_snapshot: 6500 });
    // A separate staff member keeps recurring break writes independent of earlier fixtures.
    const breakStaff = randomUUID();
    await checked(db.from('staff').insert({ id: breakStaff, salon_id: tenant, name: 'QA break staff' }));
    await checked(db.from('staff_services').insert({ salon_id: tenant, staff_id: breakStaff, service_id: service }));
    const schedules = Array.from({ length: 7 }, (_, weekday) => ({ weekday, is_working: true, start_time: '09:00', end_time: '20:00' }));
    await checked(db.from('staff_schedules').insert(schedules.map(schedule => ({ ...schedule, salon_id: tenant, staff_id: breakStaff }))));
    const breakDate = day(base + 5);
    const weekday = new Date(`${breakDate}T12:00:00Z`).getUTCDay();
    await race('booking vs break', book(breakDate, 10, breakStaff), db.rpc('save_workspace_entity', {
      p_salon_id: tenant, p_kind: 'staff', p_payload: { id: breakStaff, name: 'QA break staff', role: 'staff', active: true, service_ids: [service], schedules, breaks: [{ weekday, start_time: '10:00', end_time: '12:00' }] },
    }), ['STAFF_BREAK', 'APPOINTMENTS_IN_SCHEDULE']);
    await race('booking vs staff override', book(day(base + 6), 10), db.rpc('save_staff_schedule_override', { p_salon_id: tenant, p_staff_id: staff, p_date: day(base + 6), p_is_working: false }), ['STAFF_NOT_WORKING', 'APPOINTMENTS_IN_SCHEDULE']);
    const selfAppointment = await checked(book(day(base + 7), 10));
    const tokenHash = randomBytes(32).toString('hex');
    await checked(db.from('appointment_self_service_tokens').insert({ salon_id: tenant, appointment_id: selfAppointment, token_hash: tokenHash, expires_at: at(day(base + 8), 20) }));
    await race('self-service reschedule vs booking', db.rpc('self_service_reschedule_appointment', { p_token_hash: tokenHash, p_staff_id: staff, p_starts_at: at(day(base + 7), 15) }), book(day(base + 7), 15), ['23P01']);
    await race('self-service cancel replay', db.rpc('self_service_cancel_appointment', { p_token_hash: tokenHash }), db.rpc('self_service_cancel_appointment', { p_token_hash: tokenHash }), ['APPOINTMENT_NOT_CANCELLABLE']);
    const daily=await checked(book(day(base+8),10));
    const dailyAction=(action,status,started=null,note=null)=>db.rpc('daily_appointment_action',{p_salon_id:tenant,p_id:daily,p_action:action,p_expected_status:status,p_expected_started_at:started,p_note:note,p_expected_note:null});
    await race('daily check-in replay',dailyAction('check_in','confirmed'),dailyAction('check_in','confirmed'),['40001']);
    await race('daily start replay',dailyAction('start','checked_in'),dailyAction('start','checked_in'),['40001']);
    const begun=await checked(db.from('appointments').select('treatment_started_at').eq('id',daily).single());
    await race('daily note lost-update protection',dailyAction('note','checked_in',begun.treatment_started_at,'First'),dailyAction('note','checked_in',begun.treatment_started_at,'Second'),['40001']);
    await race('daily finish replay',dailyAction('finish','checked_in',begun.treatment_started_at),dailyAction('finish','checked_in',begun.treatment_started_at),['40001']);
    const key=randomUUID();const blockPayload={p_salon_id:tenant,p_staff_id:staff,p_starts_at:at(day(base+8),14),p_ends_at:at(day(base+8),15),p_reason:'Synthetic idempotent pause',p_request_id:key};
    const replay=await Promise.all([db.rpc('daily_create_block',blockPayload),db.rpc('daily_create_block',blockPayload)]);
    assert.ok(replay.every(r=>!r.error),'Both identical block submissions resolve safely');assert.equal(replay[0].data,replay[1].data,'Duplicate block creates one resource');
    results.push({name:'daily block duplicate replay',committed:1,replayed:1});

  }
} finally {
  // Only the random tenant created by this process; never delete existing salon data.
  await checked(db.from('salons').delete().eq('id', tenant).eq('slug', slug));
  const remaining = await checked(db.from('salons').select('id').eq('id', tenant));
  assert.equal(remaining.length, 0, 'Concurrency fixture must be removed');
}
await mkdir('qa-artifacts/performance', { recursive: true });
await writeFile('qa-artifacts/performance/concurrency.json', JSON.stringify({ sha: process.env.SALON_QA_SHA, measuredAt: new Date().toISOString(), repeats: 3, fixtureRemoved: true, results }, null, 2));
console.log('CONCURRENCY_QA_PASS', JSON.stringify({ races: results.length, fixtureRemoved: true }));
