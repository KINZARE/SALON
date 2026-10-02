import './helpers/server-imports.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const appData = await import('../src/services/app-data.ts');
const workspace = await import('../src/services/workspace-data.ts');
const completion = await import('../src/services/product-completion.ts');
const publicBooking = await import('../src/services/public-booking.ts');

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://performance-test.invalid';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
const tenant = '00000000-0000-4000-8000-000000000001';

function captureRequests(t: { mock: { method: typeof import('node:test').mock.method } }, rows: unknown[] = []) {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    urls.push(new URL(input instanceof Request ? input.url : input.toString()));
    return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
  });
  return urls;
}

test('calendar blocks include spanning blocks and exclude future days without truncating the day', async t => {
  const urls = captureRequests(t);
  // Deliberately call through a widened type to expose the missing range support before implementation.
  await (appData.getBlocks as (...args: string[]) => Promise<unknown>)(tenant, '2026-10-02T00:00:00Z', '2026-10-03T00:00:00Z');
  assert.equal(urls.length, 1);
  assert.equal(urls[0].searchParams.get('salon_id'), `eq.${tenant}`);
  assert.equal(urls[0].searchParams.get('ends_at'), 'gt.2026-10-02T00:00:00Z');
  assert.equal(urls[0].searchParams.get('starts_at'), 'lt.2026-10-03T00:00:00Z');
  assert.equal(urls[0].searchParams.get('limit'), null);
});

test('Today loads only active staff and the selected day schedule in one tenant-scoped request', async t => {
  const urls = captureRequests(t, [{ id: 'staff', name: 'A', active: true, schedules: [], breaks: [], overrides: [] }]);
  const loader = (workspace as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>).getTodayStaffSchedule;
  assert.equal(typeof loader, 'function');
  await loader(tenant, 5, '2026-10-02');
  assert.equal(urls.length, 1);
  const q = urls[0].searchParams;
  assert.equal(q.get('salon_id'), `eq.${tenant}`);
  assert.equal(q.get('active'), 'eq.true');
  assert.equal(q.get('schedules.weekday'), 'eq.5');
  assert.equal(q.get('breaks.weekday'), 'eq.5');
  assert.equal(q.get('breaks.active'), 'eq.true');
  assert.equal(q.get('overrides.override_date'), 'eq.2026-10-02');
  assert.ok(!q.get('select')?.includes('email'));
  assert.ok(!q.get('select')?.includes('staff_services'));
});

test('calendar period staff filtering reaches the database and excludes detail-only columns', async t => {
  const urls = captureRequests(t);
  await (completion.getAppointmentsForRange as (...args: string[]) => Promise<unknown>)(tenant, 'Europe/Amsterdam', '2026-10-01', '2026-11-01', 'staff');
  assert.equal(urls.length, 1);
  assert.equal(urls[0].searchParams.get('staff_id'), 'eq.staff');
  assert.equal(urls[0].searchParams.get('starts_at'), 'gte.2026-09-30T22:00:00.000Z');
  assert.ok(!urls[0].searchParams.get('select')?.includes('price_cents_snapshot'));
});

test('month calendar fetches only time and status, including DST-correct date bounds', async t => {
  const urls = captureRequests(t);
  const loader = (completion as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>).getMonthAppointments;
  assert.equal(typeof loader, 'function');
  await loader(tenant, 'Europe/Amsterdam', '2026-10-25', '2026-10-26');
  assert.equal(urls.length, 1);
  assert.equal(urls[0].searchParams.get('select'), 'starts_at,status');
  assert.deepEqual(urls[0].searchParams.getAll('starts_at'), ['gte.2026-10-24T22:00:00.000Z', 'lt.2026-10-25T23:00:00.000Z']);
  assert.equal(urls[0].searchParams.get('salon_id'), `eq.${tenant}`);
});

test('Today opening takes a closed date exception over the weekly opening', async t => {
  const urls = captureRequests(t, [{ opening: [{ weekday: 5, is_open: true, start_time: '09:00', end_time: '18:00' }], exceptions: [{ is_open: false, start_time: null, end_time: null }] }]);
  // maybeSingle receives an object rather than an array from PostgREST.
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    urls.push(new URL(input instanceof Request ? input.url : input.toString()));
    return new Response(JSON.stringify({ opening: [{ weekday: 5, is_open: true, start_time: '09:00', end_time: '18:00' }], exceptions: [{ is_open: false, start_time: null, end_time: null }] }), { headers: { 'content-type': 'application/json' } });
  });
  const loader = (appData as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>).getDayOpening;
  assert.equal(typeof loader, 'function');
  assert.deepEqual(await loader(tenant, 5, '2026-10-02'), { is_open: false, start_time: null, end_time: null });
  assert.equal(urls.length, 1);
  assert.equal(urls[0].searchParams.get('id'), `eq.${tenant}`);
  assert.equal(urls[0].searchParams.get('exceptions.exception_date'), 'eq.2026-10-02');
});

test('no-login workspace proxy never refreshes a supplied user session', async t => {
  const { NextRequest } = await import('next/server.js');
  const { proxy } = await import('../src/proxy.ts');
  const urls = captureRequests(t);
  const encoded = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ exp: Math.floor(Date.now() / 1000) + 3600, sub: tenant, role: 'authenticated' })}.test`;
  const cookie = `base64-${encoded({ access_token: token, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: tenant } })}`;
  const response = await proxy(new NextRequest('https://salon.invalid/app/today', { headers: { cookie: `sb-performance-test-auth-token=${cookie}` } }));
  assert.equal(response.status, 200);
  assert.equal(urls.length, 0, 'No-login pages must not validate or refresh unrelated Supabase cookies');
});

test('public salon loads staff-choice settings in the same tenant lookup', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    urls.push(new URL(input instanceof Request ? input.url : input.toString()));
    return new Response(JSON.stringify({ id: tenant, slug: 'salon', name: 'Salon', timezone: 'Europe/Amsterdam', currency: 'EUR', settings: [{ allow_staff_choice: false }] }), { headers: { 'content-type': 'application/json' } });
  });
  const salon = await publicBooking.getPublicSalon('salon');
  assert.equal(urls.length, 1);
  assert.equal(salon?.allowStaffChoice, false);
});

test('public eligible staff loads in one query with tenant and active restrictions', async t => {
  const urls = captureRequests(t, [{ id: 'staff', name: 'A', staff_services: [{ service_id: 'service' }] }]);
  const staff = await publicBooking.getPublicStaffForService(tenant, 'service');
  assert.equal(urls.length, 1);
  assert.deepEqual(staff, [{ id: 'staff', name: 'A' }]);
  assert.equal(urls[0].searchParams.get('salon_id'), `eq.${tenant}`);
  assert.equal(urls[0].searchParams.get('active'), 'eq.true');
  assert.equal(urls[0].searchParams.get('staff_services.service_id'), 'eq.service');
});
