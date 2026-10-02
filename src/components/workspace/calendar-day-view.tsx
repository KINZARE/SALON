import Link from "next/link";
import { fromZonedTime } from "date-fns-tz";
import { getAppointmentsForDate,getBlocks,getDayOpening,getStaff } from "@/services/app-data";
import { getCalendarBreaks } from "@/services/workspace-data";
import { shiftCalendarDate } from "@/domain/calendar-range";
import { DesktopCalendar } from "@/components/workspace/desktop-calendar";
import { MobileCalendarTimeline } from "@/components/workspace/mobile-calendar-timeline";

const minutes=(value:string|null|undefined,fallback:number)=>{if(!value)return fallback;const [hour,minute]=value.slice(0,5).split(":").map(Number);return hour*60+minute};

export async function CalendarDayView({salonId,timezone,date,today,canManage}:{salonId:string;timezone:string;date:string;today:string;canManage:boolean}){
  const base=new Date(`${date}T12:00:00Z`);
  const weekday=base.getUTCDay();
  const dayStart=fromZonedTime(`${date}T00:00:00`,timezone).toISOString();
  const dayEnd=fromZonedTime(`${shiftCalendarDate(date,1)}T00:00:00`,timezone).toISOString();
  const [appointments,allStaff,blocks,opening,breaks]=await Promise.all([
    getAppointmentsForDate(salonId,timezone,date),getStaff(salonId),getBlocks(salonId,dayStart,dayEnd),getDayOpening(salonId,weekday,date),getCalendarBreaks(salonId,weekday)
  ]);
  const staff=allStaff.filter(member=>member.active);
  const open=opening?.is_open?opening:null;
  const startMinute=Math.max(6*60,Math.floor((minutes(open?.start_time,8*60)-30)/15)*15);
  const endMinute=Math.min(23*60,Math.ceil((minutes(open?.end_time,20*60)+30)/15)*15);
  const days=Array.from({length:7},(_,index)=>shiftCalendarDate(date,index-3));
  return <>
    <div className="calendar-scroll -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
      {days.map(value=>{const d=new Date(`${value}T12:00:00Z`);const active=value===date;const isToday=value===today;return <Link key={value} href={`/app/calendar?view=day&date=${value}`} className={`min-w-[112px] rounded-[14px] border px-3 py-2.5 transition ${active?"border-[#dec2b0] bg-[var(--primary-soft)]":"border-[var(--border)] bg-white hover:bg-[var(--surface-soft)]"}`}>
        <div className="flex items-center justify-between gap-2"><span className={`text-[11px] font-semibold uppercase tracking-[.08em] ${active?"text-[var(--accent-dark)]":"text-[var(--muted)]"}`}>{new Intl.DateTimeFormat("nl-NL",{weekday:"short",timeZone:"UTC"}).format(d)}</span>{isToday?<span className="rounded-full bg-[var(--ink)] px-1.5 py-0.5 text-[9px] font-semibold text-white">NU</span>:null}</div>
        <span className="mt-1 block text-sm font-semibold">{new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(d)}</span>
      </Link>})}
    </div>
    <MobileCalendarTimeline date={date} timezone={timezone} appointments={appointments} staff={staff} blocks={blocks} breaks={breaks} canManage={canManage}/>
    <div data-desktop-calendar className="hidden md:block"><DesktopCalendar date={date} timezone={timezone} appointments={appointments} staff={staff} blocks={blocks} breaks={breaks} canManage={canManage} startMinute={startMinute} endMinute={endMinute}/></div>
  </>;
}
