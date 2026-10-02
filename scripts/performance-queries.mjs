import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const source = process.env.SALON_SOURCE_ROOT ?? process.cwd();
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
  if (specifier.startsWith('@/')) return { url: pathToFileURL(path.join(source, 'src', specifier.slice(2) + '.ts')).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const load = relative => import(pathToFileURL(path.join(source, relative)).href);
const { createAdminSupabaseClient } = await load('src/lib/supabase/admin.ts');
const { getTodayWorkspace } = await load('src/services/today-workspace.ts');
const appData = await load('src/services/app-data.ts');
const workspace = await load('src/services/workspace-data.ts');
const completion = await load('src/services/product-completion.ts');
const { getPublicSalon, getPublicServices, getPublicStaffForService, getPublicStaffByService, getAvailableSlotsForDate } = await load('src/services/public-booking.ts');
const { formatInTimeZone, fromZonedTime } = await import('date-fns-tz');
const realFetch = globalThis.fetch;
let requests = [];
globalThis.fetch = async (input, init) => {
  const started = performance.now();
  const response = await realFetch(input, init);
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.pathname.startsWith('/rest/v1/')) {
    const body = await response.clone().text();
    requests.push({ table: url.pathname.split('/').at(-1), ms: performance.now() - started, bytes: Buffer.byteLength(body), ok: response.ok });
  }
  return response;
};
const profiles = [];
const measure = async (name, run) => {
  requests = [];
  const start = performance.now();
  await run();
  if (requests.some(r => !r.ok)) throw new Error(`Read-only profiling failed: ${name}`);
  profiles.push({ name, ms: performance.now() - start, requests: [...requests], calls: requests.length, bytes: requests.reduce((sum, r) => sum + r.bytes, 0) });
};
const db = createAdminSupabaseClient();
const context = async () => {
  const { data, error } = await db.from('salons').select('id,name,slug,timezone,currency').eq('slug', 'salon').single();
  if (error) throw error;
  return data;
};
let salon;
await measure('Today', async () => { salon = await context(); await getTodayWorkspace(salon.id, salon.timezone, { includeWaitlist: true }); });
const date = formatInTimeZone(new Date(), salon.timezone, 'yyyy-MM-dd');
const tomorrow = new Date(new Date(`${date}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
const start = fromZonedTime(`${date}T00:00:00`, salon.timezone).toISOString();
const end = fromZonedTime(`${tomorrow}T00:00:00`, salon.timezone).toISOString();
await measure('Calendar Day', async () => {
  await context();
  await Promise.all([appData.getAppointmentsForDate(salon.id, salon.timezone, date), appData.getStaff(salon.id), appData.getBlocks(salon.id, start, end), appData.getDayOpening ? appData.getDayOpening(salon.id, weekday, date) : appData.getOpeningHours(salon.id), workspace.getCalendarBreaks(salon.id, weekday)]);
});
const { getMonthGrid, shiftCalendarDate } = await load('src/domain/calendar-range.ts');
const month = getMonthGrid(date);
await measure('Calendar Month', async () => {
  await context();
  await Promise.all([(completion.getMonthAppointments ?? completion.getAppointmentsForRange)(salon.id, salon.timezone, month[0], shiftCalendarDate(month.at(-1), 1)), appData.getOpeningHours(salon.id), completion.getOpeningExceptions(salon.id, month[0], month.at(-1))]);
});
await measure('Public booking metadata', async () => { const s = await getPublicSalon('salon'); await getPublicServices(s.id); });
await measure('Public booking full page', async () => {
  const s = await getPublicSalon('salon');
  const list = await getPublicServices(s.id);
  if(s.allowStaffChoice){
    if(getPublicStaffByService)await getPublicStaffByService(s.id,list.map(item=>item.id));
    else await Promise.all(list.map(item=>getPublicStaffForService(s.id,item.id)));
  }
});
const services = await getPublicServices(salon.id);
if (services.length) {
  await measure('Public eligible staff', () => getPublicStaffForService(salon.id, services[0].id));
  await measure('Live availability', () => getAvailableSlotsForDate({ salonSlug: 'salon', serviceId: services[0].id, date: tomorrow }));
}
globalThis.fetch = realFetch;
const label = process.env.QA_PROFILE_LABEL ?? 'candidate';
await mkdir('qa-artifacts/performance', { recursive: true });
await writeFile(`qa-artifacts/performance/queries-${label}.json`, JSON.stringify({ label, date, profiles }, null, 2));
console.log('QUERY_PROFILE', JSON.stringify({ label, profiles }));
