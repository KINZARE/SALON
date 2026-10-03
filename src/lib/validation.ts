import { IsoDateSchema, UuidSchema } from "./schemas.ts";

export function isUuid(value: string | null | undefined): value is string {
  return UuidSchema.safeParse(value).success;
}

export function isIsoDate(value: string | null | undefined): value is string {
  return IsoDateSchema.safeParse(value).success;
}

export function normalizeOptionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}
