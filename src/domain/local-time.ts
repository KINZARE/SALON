import "server-only";
import { Temporal } from "@js-temporal/polyfill";

const localInput = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Resolve exactly one instant; reject skipped or repeated DST local times. */
export function parseUnambiguousLocalDateTime(value: string, timezone: string): Date | null {
  if (!localInput.test(value)) return null;
  try {
    const zoned = Temporal.ZonedDateTime.from(`${value}:00[${timezone}]`, { disambiguation: "reject", overflow: "reject" });
    return new Date(zoned.epochMilliseconds);
  } catch {
    return null;
  }
}
