export type Interval = {
  start: Date;
  end: Date;
};

export type StaffAvailabilityInput = {
  staffId: string;
  salonOpen: Interval[];
  staffWorking: Interval[];
  breaks: Interval[];
  blocks: Interval[];
  appointments: Interval[];
};

export type AvailabilityRequest = {
  serviceDurationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  minStart?: Date;
  staff: StaffAvailabilityInput[];
};

export type AvailableSlot = {
  start: Date;
  serviceEnd: Date;
  occupiedUntil: Date;
  staffIds: string[];
};

const minute = 60_000;

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

function contains(container: Interval, value: Interval): boolean {
  return container.start <= value.start && container.end >= value.end;
}

function intersect(a: Interval, b: Interval): Interval | null {
  const start = new Date(Math.max(a.start.getTime(), b.start.getTime()));
  const end = new Date(Math.min(a.end.getTime(), b.end.getTime()));
  return start < end ? { start, end } : null;
}

function ceilToIncrement(date: Date, intervalMinutes: number, anchor: Date): Date {
  const step = intervalMinutes * minute;
  const elapsed = Math.max(0, date.getTime() - anchor.getTime());
  return new Date(anchor.getTime() + Math.ceil(elapsed / step) * step);
}

export function computeAvailability(request: AvailabilityRequest): AvailableSlot[] {
  if (request.serviceDurationMinutes <= 0) throw new Error("Service duration must be positive");
  if (request.bufferMinutes < 0) throw new Error("Buffer cannot be negative");
  if (request.slotIntervalMinutes <= 0) throw new Error("Slot interval must be positive");

  const slotMap = new Map<string, AvailableSlot>();
  const occupiedMinutes = request.serviceDurationMinutes + request.bufferMinutes;

  for (const member of request.staff) {
    for (const salonWindow of member.salonOpen) {
      for (const workWindow of member.staffWorking) {
        const window = intersect(salonWindow, workWindow);
        if (!window) continue;

        let cursor = new Date(window.start);
        if (request.minStart && cursor < request.minStart) {
          cursor = ceilToIncrement(request.minStart, request.slotIntervalMinutes, window.start);
        }

        while (cursor < window.end) {
          const serviceEnd = new Date(cursor.getTime() + request.serviceDurationMinutes * minute);
          const occupiedUntil = new Date(cursor.getTime() + occupiedMinutes * minute);
          const candidate = { start: cursor, end: occupiedUntil };

          if (!contains(window, candidate)) break;

          const conflict = [...member.breaks, ...member.blocks, ...member.appointments]
            .some((blocked) => overlaps(candidate, blocked));

          if (!conflict) {
            const key = cursor.toISOString();
            const existing = slotMap.get(key);
            if (existing) {
              existing.staffIds.push(member.staffId);
            } else {
              slotMap.set(key, {
                start: new Date(cursor),
                serviceEnd,
                occupiedUntil,
                staffIds: [member.staffId],
              });
            }
          }

          cursor = new Date(cursor.getTime() + request.slotIntervalMinutes * minute);
        }
      }
    }
  }

  return [...slotMap.values()]
    .map((slot) => ({ ...slot, staffIds: [...new Set(slot.staffIds)].sort() }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
