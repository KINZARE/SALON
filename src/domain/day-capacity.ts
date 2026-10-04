export type CapacityInterval = { start: Date; end: Date };
export type CapacityAppointment = CapacityInterval & { status: string };
export type StaffGap = CapacityInterval & { durationMinutes: number };

export type StaffGapInput = {
  working: CapacityInterval[];
  breaks: CapacityInterval[];
  blocks: CapacityInterval[];
  appointments: CapacityAppointment[];
  minGapMinutes?: number;
};

export type CapacitySummary = {
  bookableMinutes: number;
  occupiedMinutes: number;
  freeMinutes: number;
  occupancyPercent: number;
};

const minuteMs = 60_000;
const activeStatuses = new Set(["pending", "confirmed", "checked_in"]);
const occupiedCapacityStatuses = new Set(["pending", "confirmed", "checked_in", "completed", "no_show"]);

function clip(value: CapacityInterval, container: CapacityInterval): CapacityInterval | null {
  const start = new Date(Math.max(value.start.getTime(), container.start.getTime()));
  const end = new Date(Math.min(value.end.getTime(), container.end.getTime()));
  return start < end ? { start, end } : null;
}

function mergeIntervals(values: CapacityInterval[]) {
  const sorted = values
    .filter((value) => value.start < value.end)
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());
  const merged: CapacityInterval[] = [];
  for (const value of sorted) {
    const previous = merged.at(-1);
    if (!previous || value.start > previous.end) {
      merged.push({ start: new Date(value.start), end: new Date(value.end) });
      continue;
    }
    if (value.end > previous.end) previous.end = new Date(value.end);
  }
  return merged;
}

function subtractIntervals(container: CapacityInterval, exclusions: CapacityInterval[]) {
  const clipped = mergeIntervals(exclusions.flatMap((item) => {
    const value = clip(item, container);
    return value ? [value] : [];
  }));
  const available: CapacityInterval[] = [];
  let cursor = new Date(container.start);

  for (const item of clipped) {
    if (item.start > cursor) available.push({ start: new Date(cursor), end: new Date(item.start) });
    if (item.end > cursor) cursor = new Date(item.end);
  }

  if (cursor < container.end) available.push({ start: cursor, end: new Date(container.end) });
  return available;
}

function intervalMinutes(values: CapacityInterval[]) {
  return values.reduce((sum, item) => sum + Math.round((item.end.getTime() - item.start.getTime()) / minuteMs), 0);
}

export function computeCapacitySummary(input: Omit<StaffGapInput, "minGapMinutes">): CapacitySummary {
  const working = mergeIntervals(input.working);
  const exclusions = [...input.breaks, ...input.blocks];
  const bookable = working.flatMap((interval) => subtractIntervals(interval, exclusions));
  const appointmentBusy = input.appointments
    .filter((item) => occupiedCapacityStatuses.has(item.status))
    .map(({ start, end }) => ({ start, end }));
  const occupied = bookable.flatMap((interval) => mergeIntervals(appointmentBusy.flatMap((item) => {
    const value = clip(item, interval);
    return value ? [value] : [];
  })));

  const bookableMinutes = intervalMinutes(bookable);
  const occupiedMinutes = Math.min(bookableMinutes, intervalMinutes(occupied));
  const freeMinutes = Math.max(0, bookableMinutes - occupiedMinutes);
  const occupancyPercent = bookableMinutes ? Math.round((occupiedMinutes / bookableMinutes) * 1_000) / 10 : 0;

  return { bookableMinutes, occupiedMinutes, freeMinutes, occupancyPercent };
}

export function computeStaffGaps(input: StaffGapInput): StaffGap[] {
  const minGapMinutes = input.minGapMinutes ?? 30;
  const appointmentBusy = input.appointments
    .filter((item) => activeStatuses.has(item.status))
    .map(({ start, end }) => ({ start, end }));
  const busy = [...input.breaks, ...input.blocks, ...appointmentBusy];
  const gaps: StaffGap[] = [];

  for (const working of input.working.toSorted((a, b) => a.start.getTime() - b.start.getTime())) {
    const clippedBusy = mergeIntervals(busy.flatMap((item) => {
      const value = clip(item, working);
      return value ? [value] : [];
    }));

    let cursor = new Date(working.start);
    for (const item of clippedBusy) {
      if (item.start > cursor) {
        const durationMinutes = Math.round((item.start.getTime() - cursor.getTime()) / minuteMs);
        if (durationMinutes >= minGapMinutes) gaps.push({ start: new Date(cursor), end: new Date(item.start), durationMinutes });
      }
      if (item.end > cursor) cursor = new Date(item.end);
    }

    if (cursor < working.end) {
      const durationMinutes = Math.round((working.end.getTime() - cursor.getTime()) / minuteMs);
      if (durationMinutes >= minGapMinutes) gaps.push({ start: cursor, end: new Date(working.end), durationMinutes });
    }
  }

  return gaps;
}
