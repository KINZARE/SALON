import "server-only";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { computeCapacitySummary, computeStaffGaps, type CapacityInterval } from "@/domain/day-capacity";
import { selectCurrentNext } from "@/domain/today-actions";
import { calculateAppointmentKpis } from "@/domain/reporting";
import { getAppointmentsForDate, getBlocks, getDayOpening } from "@/services/app-data";
import { getTodayStaffSchedule } from "@/services/workspace-data";
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
  currentAppointment: TodayAppointment | null;
  blocks: Awaited<ReturnType<typeof getBlocks>>;
  breaks: {staffId:string;staffName:string;start:Date;end:Date}[];
  waitlistMatches: Awaited<ReturnType<typeof findWaitlistMatchesForGaps>>;
  appointmentCount: number;
  plannedValueCents: number;
  completedCount: number;
  workingStaffCount: number;
  bookableMinutes: number;
  occupiedMinutes: number;
  freeCapacityMinutes: number;
  occupancyPercent: number;
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

  const [appointments, staff, open, blocks] = await Promise.all([
    getAppointmentsForDate(salonId, timezone, date),
    getTodayStaffSchedule(salonId, weekday, date),
    getDayOpening(salonId, weekday, date),
    getBlocks(salonId, dayStart.toISOString(), dayEnd.toISOString()),
  ]);

  const dayBlocks = blocks.filter((block) => new Date(block.starts_at) < dayEnd && new Date(block.ends_at) > dayStart);
  const gaps: TodayGap[] = [];
  const dayBreaks: {staffId:string;staffName:string;start:Date;end:Date}[] = [];
  let workingStaffCount = 0;
  let bookableMinutes = 0;
  let occupiedMinutes = 0;

  if (open?.is_open && open.start_time && open.end_time) {
    const salonWindow = localInterval(date, timezone, open.start_time, open.end_time);
    for (const member of staff.filter((item) => item.active)) {
      const schedule = member.overrides?.[0] ?? member.schedules.find((row) => row.weekday === weekday);
      if (!schedule?.is_working || !schedule.start_time || !schedule.end_time) continue;
      const staffWindow = localInterval(date, timezone, schedule.start_time, schedule.end_time);
      const working = intersect(salonWindow, staffWindow);
      if (!working) continue;
      workingStaffCount += 1;

      const memberBreaks = member.breaks
        .filter((row) => row.weekday === weekday)
        .map((row) => localInterval(date, timezone, row.start_time, row.end_time));
      dayBreaks.push(...memberBreaks.map(interval=>({staffId:member.id,staffName:member.name,...interval})));
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

      const capacity = computeCapacitySummary({
        working: [working],
        breaks: memberBreaks,
        blocks: memberBlocks,
        appointments: memberAppointments,
      });
      bookableMinutes += capacity.bookableMinutes;
      occupiedMinutes += capacity.occupiedMinutes;

      for (const gap of computeStaffGaps({
        working: [working],
        breaks: memberBreaks,
        blocks: memberBlocks,
        appointments: memberAppointments,
      })) {
        if (gap.end > now) { const start = new Date(Math.max(gap.start.getTime(),now.getTime())); const durationMinutes=Math.floor((gap.end.getTime()-start.getTime())/60000); if(durationMinutes>=30) gaps.push({staffId:member.id,staffName:member.name,start,end:gap.end,durationMinutes}); }
      }
    }
  }

  const activeAppointments = appointments.filter((item) => !["cancelled", "no_show"].includes(item.status));
  const {current:currentAppointment,next:nextAppointment}=selectCurrentNext(appointments,now);
  const appointmentKpis = calculateAppointmentKpis(appointments);
  const freeCapacityMinutes = Math.max(0, bookableMinutes - occupiedMinutes);
  const occupancyPercent = bookableMinutes ? Math.round((occupiedMinutes / bookableMinutes) * 1_000) / 10 : 0;

  const waitlistMatches = options.includeWaitlist ? await findWaitlistMatchesForGaps(salonId, date, gaps) : [];
  const attention: TodayAttention[] = [];

  return {
    date,
    appointments,
    activeAppointments,
    nextAppointment,
    currentAppointment,
    blocks:dayBlocks,
    breaks:dayBreaks,
    waitlistMatches,
    appointmentCount: appointmentKpis.appointments,
    plannedValueCents: appointmentKpis.plannedValueCents,
    completedCount: appointmentKpis.completed,
    workingStaffCount,
    bookableMinutes,
    occupiedMinutes,
    freeCapacityMinutes,
    occupancyPercent,
    gaps: gaps.toSorted((a, b) => a.start.getTime() - b.start.getTime()),
    attention,
  };
}
