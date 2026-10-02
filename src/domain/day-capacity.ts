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

const minuteMs = 60_000;
const activeStatuses = new Set(["pending", "confirmed", "checked_in"]);

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
