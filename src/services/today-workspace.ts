import "server-only";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { computeStaffGaps, type CapacityInterval } from "@/domain/day-capacity";
import { getAppointmentsForDate, getBlocks, getOpeningHours } from "@/services/app-data";
import { getWorkspaceStaff } from "@/services/workspace-data";
import { findWaitlistMatchesForGaps } from "@/services/waitlist";

type Appointments = Awaited<ReturnType<typeof getAppointmentsForDate>>;
export type TodayAppointment = Appointments[number];

export type TodayGap = {
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  durationMinutes: number;
};

export type TodayAttention = {
  kind: "cancellation" | "no_show" | "capacity" | "waitlist";
  label: string;
  href: string;
};

export type TodayWorkspaceData = {
  date: string;
  appointments: Appointments;
  activeAppointments: Appointments;
  nextAppointment: TodayAppointment | null;
  plannedRevenueCents: number;
  completedCount: number;
  workingStaffCount: number;
  gaps: TodayGap[];
  attention: TodayAttention[];
};

function localInterval(date: string, timezone: string, start: string, end: string): CapacityInterval {
  return {
    start: fromZonedTime(`${date}T${start.slice(0, 5)}:00`, timezone),
    end: fromZonedTime(`${date}T${end.slice(0, 5)}:00`, timezone),
  };
}

function intersect(a: CapacityInterval, b: CapacityInterval): CapacityInterval | null {
  const start = new Date(Math.max(a.start.getTime(), b.start.getTime()));
  const end = new Date(Math.min(a.end.getTime(), b.end.getTime()));
  return start < end ? { start, end } : null;
}

export async function getTodayWorkspace(salonId: string, timezone: string, options: { includeWaitlist?: boolean } = {}): Promise<TodayWorkspaceData> {
  const now = new Date();
  const date = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const calendar = new Date(`${date}T12:00:00Z`);
  const weekday = calendar.getUTCDay();
  const nextDate = new Date(calendar.getTime() + 86_400_000).toISOString().slice(0, 10);
  const dayStart = fromZonedTime(`${date}T00:00:00`, timezone);
  const dayEnd = fromZonedTime(`${nextDate}T00:00:00`, timezone);

  const [appointments, staff, openingHours, blocks] = await Promise.all([
    getAppointmentsForDate(salonId, timezone, date),
    getWorkspaceStaff(salonId),
    getOpeningHours(salonId),
    getBlocks(salonId, dayStart.toISOString()),
  ]);

  const open = openingHours.find((row) => row.weekday === weekday && row.is_open);
  const dayBlocks = blocks.filter((block) => new Date(block.starts_at) < dayEnd && new Date(block.ends_at) > dayStart);
  const gaps: TodayGap[] = [];
  let workingStaffCount = 0;

  if (open) {
    const salonWindow = localInterval(date, timezone, open.start_time, open.end_time);
    for (const member of staff.filter((item) => item.active)) {
      const schedule = member.schedules.find((row) => row.weekday === weekday && row.is_working);
      if (!schedule) continue;
      const staffWindow = localInterval(date, timezone, schedule.start_time, schedule.end_time);
      const working = intersect(salonWindow, staffWindow);
      if (!working) continue;
      workingStaffCount += 1;

      const memberBreaks = member.breaks
        .filter((row) => row.weekday === weekday)
        .map((row) => localInterval(date, timezone, row.start_time, row.end_time));
      const memberBlocks = dayBlocks
        .filter((block) => block.staff_id === null || block.staff_id === member.id)
        .map((block) => ({ start: new Date(block.starts_at), end: new Date(block.ends_at) }));
      const memberAppointments = appointments
        .filter((appointment) => appointment.staff_id === member.id)
        .map((appointment) => ({
          start: new Date(appointment.starts_at),
          end: new Date(appointment.occupied_until),
          status: appointment.status,
        }));

      for (const gap of computeStaffGaps({
        working: [working],
        breaks: memberBreaks,
        blocks: memberBlocks,
        appointments: memberAppointments,
      })) {
        if (gap.end > now) gaps.push({ staffId: member.id, staffName: member.name, ...gap });
      }
    }
  }

  const activeAppointments = appointments.filter((item) => !["cancelled", "no_show"].includes(item.status));
  const upcoming = appointments.filter((item) => ["pending", "confirmed"].includes(item.status) && new Date(item.starts_at) > now);
  const nextAppointment = upcoming[0] ?? null;
  const plannedRevenueCents = activeAppointments.reduce((sum, item) => sum + item.price_cents_snapshot, 0);
  const completedCount = appointments.filter((item) => item.status === "completed").length;

  const cancelled = appointments.filter((item) => item.status === "cancelled").length;
  const noShows = appointments.filter((item) => item.status === "no_show").length;
  const largeGap = gaps
    .filter((gap) => gap.durationMinutes >= 90 && gap.end > now)
    .toSorted((a, b) => a.start.getTime() - b.start.getTime())[0];

  const waitlistMatches = options.includeWaitlist ? await findWaitlistMatchesForGaps(salonId, date, gaps) : [];
  const attention: TodayAttention[] = [];
  if (cancelled) attention.push({ kind: "cancellation", label: `${cancelled} geannuleerde afspraak${cancelled === 1 ? "" : "en"} vandaag`, href: "/app/calendar" });
  if (noShows) attention.push({ kind: "no_show", label: `${noShows} no-show${noShows === 1 ? "" : "s"} vandaag`, href: "/app/calendar" });
  if (largeGap) attention.push({
    kind: "capacity",
    label: `${largeGap.staffName} heeft ${largeGap.durationMinutes} min vrije ruimte vanaf ${formatInTimeZone(largeGap.start, timezone, "HH:mm")}`,
    href: "/app/calendar",
  });
  if (waitlistMatches.length) attention.push({
    kind: "waitlist",
    label: `${waitlistMatches.length} wachtlijstmatch${waitlistMatches.length===1?"":"es"} voor vrije ruimte vandaag`,
    href: "/app/waitlist",
  });

  return {
    date,
    appointments,
    activeAppointments,
    nextAppointment,
    plannedRevenueCents,
    completedCount,
    workingStaffCount,
    gaps: gaps.toSorted((a, b) => a.start.getTime() - b.start.getTime()),
    attention,
  };
}
