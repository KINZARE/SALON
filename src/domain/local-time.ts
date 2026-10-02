import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const localPattern = "yyyy-MM-dd'T'HH:mm";
const localInput = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Converts a browser datetime-local value only when it maps to exactly one instant.
 * Non-existent spring-forward times and ambiguous fall-back times are rejected.
 */
export function parseUnambiguousLocalDateTime(value: string, timezone: string): Date | null {
  if (!localInput.test(value)) return null;
  const primary = fromZonedTime(value, timezone);
  if (Number.isNaN(primary.getTime()) || formatInTimeZone(primary, timezone, localPattern) !== value) return null;

  let matches = 0;
  const start = primary.getTime() - 180 * 60_000;
  const end = primary.getTime() + 180 * 60_000;
  for (let instant = start; instant <= end; instant += 60_000) {
    if (formatInTimeZone(new Date(instant), timezone, localPattern) === value) {
      matches += 1;
      if (matches > 1) return null;
    }
  }
  return matches === 1 ? primary : null;
}
