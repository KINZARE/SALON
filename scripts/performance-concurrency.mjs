import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
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
const book = (date, hour) => db.rpc('create_appointment_atomic', {
  p_salon_id: tenant, p_service_id: service, p_staff_id: staff, p_starts_at: at(date, hour),
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
    const base = 2 + repeat * 6;
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
