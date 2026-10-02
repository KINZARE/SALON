import test from 'node:test';
import assert from 'node:assert/strict';

test('historical appointments remain visible outside an opening exception', async () => {
  const hours = await import('../src/domain/calendar-hours.ts').catch(() => null);
  assert.equal(typeof hours?.getCalendarMinuteRange, 'function');
  assert.deepEqual(hours!.getCalendarMinuteRange(12 * 60, 17 * 60, [{ start: 9 * 60, end: 10 * 60 }]), { startMinute: 8 * 60 + 30, endMinute: 17 * 60 + 30 });
});

test('calendar includes late appointments and caps intervals at the day boundary', async () => {
  const hours = await import('../src/domain/calendar-hours.ts').catch(() => null);
  assert.equal(typeof hours?.getCalendarMinuteRange, 'function');
  assert.deepEqual(hours!.getCalendarMinuteRange(9 * 60, 18 * 60, [{ start: 23 * 60, end: 24 * 60 }]), { startMinute: 8 * 60 + 30, endMinute: 24 * 60 });
});
