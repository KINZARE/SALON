export function waitlistEntryMatchesGap({
  gapDate,
  gapStaffId,
  gapDurationMinutes,
  windowStart,
  windowEnd,
  preferredStaffId,
  eligibleStaffIds,
  serviceDurationMinutes,
  bufferMinutes,
}: {
  gapDate: string;
  gapStaffId: string;
  gapDurationMinutes: number;
  windowStart: string;
  windowEnd: string;
  preferredStaffId: string | null;
  eligibleStaffIds: string[];
  serviceDurationMinutes: number;
  bufferMinutes: number;
}) {
  if (gapDate < windowStart || gapDate > windowEnd) return false;
  if (preferredStaffId && preferredStaffId !== gapStaffId) return false;
  if (!eligibleStaffIds.includes(gapStaffId)) return false;
  return serviceDurationMinutes + bufferMinutes <= gapDurationMinutes;
}
