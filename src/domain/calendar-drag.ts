type DragTargetArgs = {
  originalMinute: number;
  deltaY: number;
  pxPerMinute: number;
  stepMinutes: number;
  startMinute: number;
  endMinute: number;
  occupiedMinutes: number;
};

export function getDraggedTargetMinute({
  originalMinute,
  deltaY,
  pxPerMinute,
  stepMinutes,
  startMinute,
  endMinute,
  occupiedMinutes,
}: DragTargetArgs) {
  const deltaMinutes = deltaY / pxPerMinute;
  const snapped = originalMinute + Math.round(deltaMinutes / stepMinutes) * stepMinutes;
  const latestStart = Math.max(startMinute, endMinute - occupiedMinutes);
  return Math.min(latestStart, Math.max(startMinute, snapped));
}

export function shiftAppointmentTimes({
  startsAt,
  serviceEndsAt,
  occupiedUntil,
  deltaMinutes,
}: {
  startsAt: string;
  serviceEndsAt: string;
  occupiedUntil: string;
  deltaMinutes: number;
}) {
  const shift = (iso: string) => new Date(new Date(iso).getTime() + deltaMinutes * 60_000).toISOString();
  return {
    startsAt: shift(startsAt),
    serviceEndsAt: shift(serviceEndsAt),
    occupiedUntil: shift(occupiedUntil),
  };
}
