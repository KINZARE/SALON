/** Opening hours determine the default view; existing appointments remain visible. */
export function getCalendarMinuteRange(openStart: number, openEnd: number, intervals: { start: number; end: number }[]) {
  let startMinute = Math.max(6 * 60, Math.floor((openStart - 30) / 15) * 15);
  let endMinute = Math.min(23 * 60, Math.ceil((openEnd + 30) / 15) * 15);
  for (const interval of intervals) {
    startMinute = Math.min(startMinute, Math.floor((interval.start - 30) / 15) * 15);
    endMinute = Math.max(endMinute, Math.ceil((interval.end + 30) / 15) * 15);
  }
  return { startMinute: Math.max(0, startMinute), endMinute: Math.min(24 * 60, endMinute) };
}
