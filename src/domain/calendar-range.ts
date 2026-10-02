const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string): Date {
  if (!DATE_RE.test(value)) throw new Error("INVALID_DATE");
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE");
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return isoDate(date);
}

export function getWeekDates(value: string): string[] {
  const date = parseDate(value);
  const weekday = date.getUTCDay();
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(value, offsetToMonday);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function getMonthGrid(value: string): string[] {
  const date = parseDate(value);
  const monthStart = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 12));
  const monthEnd = addDays(isoDate(nextMonth), -1);
  const gridStart = getWeekDates(monthStart)[0];
  const gridEnd = getWeekDates(monthEnd)[6];
  const dates: string[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) dates.push(cursor);
  return dates;
}

export function shiftCalendarDate(value: string, amount: number): string {
  return addDays(value, amount);
}
