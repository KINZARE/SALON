import { parseISO, format } from "date-fns";
import { utc } from "@date-fns/utc";
import { IsoDateSchema } from "../lib/schemas.ts";

// Calendar/report dates have no timezone. UTC context prevents host TZ or DST drift.
export function parseDateOnly(value: string) {
  if (!IsoDateSchema.safeParse(value).success) throw new Error("INVALID_DATE");
  return parseISO(value, { in: utc });
}
export function formatDateOnly(value: Date) {
  return format(value, "yyyy-MM-dd", { in: utc });
}
