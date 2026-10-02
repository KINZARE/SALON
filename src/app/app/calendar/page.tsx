import Link from "next/link";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getAppointmentsForDate, getBlocks, getOpeningHours, getStaff } from "@/services/app-data";
import { getCalendarBreaks } from "@/services/workspace-data";
import { CalendarBoard } from "@/components/workspace/calendar-board";
import { MobileCalendarTimeline } from "@/components/workspace/mobile-calendar-timeline";

const minutes=(value:string|null|undefined,fallback:number)=>{if(!value)return fallback;const [hour,minute]=value.slice(0,5).split(":").map(Number);return hour*60+minute;};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { salon, membership } = await requireAppContext();
  const params = await searchParams;
  const today = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd");
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const base = new Date(`${date}T12:00:00Z`);
  const weekday=base.getUTCDay();
  const dayStart=fromZonedTime(`${date}T00:00:00`,salon.timezone).toISOString();
  const [appointments,allStaff,blocks,opening,breaks]=await Promise.all([
    getAppointmentsForDate(salon.id,salon.timezone,date), getStaff(salon.id), getBlocks(salon.id,dayStart), getOpeningHours(salon.id), getCalendarBreaks(salon.id,weekday)
  ]);
  const staff=allStaff.filter(member=>member.active);
  const open=opening.find(row=>row.weekday===weekday&&row.is_open);
  const startMinute=Math.max(6*60,Math.floor((minutes(open?.start_time,8*60)-30)/15)*15);
  const endMinute=Math.min(23*60,Math.ceil((minutes(open?.end_time,20*60)+30)/15)*15);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(base.getTime()+(i-3)*86_400_000);return d.toISOString().slice(0,10);});
  const previousDate=new Date(base.getTime()-86_400_000).toISOString().slice(0,10);
  const nextDate=new Date(base.getTime()+86_400_000).toISOString().slice(0,10);
  const canManage=["owner","manager"].includes(membership.role);
  const selectedLabel=new Intl.DateTimeFormat("nl-NL",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(base);

  return <>
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[var(--accent)]"><span className="h-2 w-2 rounded-full bg-[var(--accent)]"/>Teamagenda</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Calendar</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Afspraken, medewerkers, pauzes en geblokkeerde tijd in één rustige planning.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-11 items-center rounded-[14px] border border-[var(--border)] bg-white">
          <Link aria-label="Vorige dag" href={`/app/calendar?date=${previousDate}`} className="grid h-full w-10 place-items-center border-r border-[var(--border)] text-lg text-[var(--muted)] hover:bg-[var(--surface-soft)]">‹</Link>
          <div className="min-w-[180px] px-4 text-center text-sm font-semibold capitalize">{selectedLabel}</div>
          <Link aria-label="Volgende dag" href={`/app/calendar?date=${nextDate}`} className="grid h-full w-10 place-items-center border-l border-[var(--border)] text-lg text-[var(--muted)] hover:bg-[var(--surface-soft)]">›</Link>
        </div>
        {date!==today?<Link href="/app/calendar" className="inline-flex h-11 items-center rounded-[14px] border border-[var(--border)] bg-white px-3.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)]">Vandaag</Link>:null}
        {canManage?<Link href="/app/calendar/new" className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[#24231f]"><span className="text-lg leading-none">＋</span>Nieuwe afspraak</Link>:null}
      </div>
    </header>

    <div className="calendar-scroll -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
      {days.map(value=>{
        const d=new Date(`${value}T12:00:00Z`);
        const active=value===date;
        const isToday=value===today;
        return <Link key={value} href={`/app/calendar?date=${value}`} className={`min-w-[112px] rounded-[14px] border px-3 py-2.5 transition ${active?"border-[#dec2b0] bg-[var(--primary-soft)]":"border-[var(--border)] bg-white hover:bg-[var(--surface-soft)]"}`}>
          <div className="flex items-center justify-between gap-2"><span className={`text-[11px] font-semibold uppercase tracking-[.08em] ${active?"text-[var(--accent-dark)]":"text-[var(--muted)]"}`}>{new Intl.DateTimeFormat("nl-NL",{weekday:"short",timeZone:"UTC"}).format(d)}</span>{isToday?<span className="rounded-full bg-[var(--ink)] px-1.5 py-0.5 text-[9px] font-semibold text-white">NU</span>:null}</div>
          <span className="mt-1 block text-sm font-semibold">{new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(d)}</span>
        </Link>;
      })}
    </div>

    <MobileCalendarTimeline date={date} timezone={salon.timezone} appointments={appointments} staff={staff} blocks={blocks} breaks={breaks} canManage={canManage}/>
    <div data-desktop-calendar className="hidden md:block">
      <CalendarBoard date={date} timezone={salon.timezone} appointments={appointments} staff={staff} blocks={blocks} breaks={breaks} canManage={canManage} startMinute={startMinute} endMinute={endMinute}/>
    </div>
  </>;
}