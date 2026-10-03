import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getWeekDates,shiftCalendarDate } from "@/domain/calendar-range";
import { CalendarDayView } from "@/components/workspace/calendar-day-view";
import { CalendarPeriodView } from "@/components/workspace/calendar-period-view";

type CalendarView="day"|"week"|"month";

function monthShift(date:string,amount:number){
  const current=new Date(`${date.slice(0,7)}-01T12:00:00Z`);
  current.setUTCMonth(current.getUTCMonth()+amount);
  return current.toISOString().slice(0,10);
}

export default async function CalendarPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  const params=await searchParams;
  const today=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  const date=typeof params.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(params.date)?params.date:today;
  const view:CalendarView=params.view==="week"||params.view==="month"?params.view:"day";
  const staffFilter=typeof params.staff==="string"?params.staff:null;
  const canManage=["owner","manager"].includes(membership.role);
  const previousDate=view==="month"?monthShift(date,-1):shiftCalendarDate(date,view==="week"?-7:-1);
  const nextDate=view==="month"?monthShift(date,1):shiftCalendarDate(date,view==="week"?7:1);

  let label:string;
  if(view==="day")label=new Intl.DateTimeFormat("nl-NL",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${date}T12:00:00Z`));
  else if(view==="week"){
    const dates=getWeekDates(date);
    const start=new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${dates[0]}T12:00:00Z`));
    const end=new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${dates[6]}T12:00:00Z`));
    label=`${start} – ${end}`;
  }else label=new Intl.DateTimeFormat("nl-NL",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${date}T12:00:00Z`));

  const nav=(target:string)=>`/app/calendar?view=${view}&date=${target}${staffFilter?`&staff=${staffFilter}`:""}`;
  return <>
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[var(--primary)]"><span className="h-2 w-2 rounded-full bg-[var(--primary)]"/>Teamagenda</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-[36px]">Calendar</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Dag voor detailplanning, week voor ritme en maand voor overzicht.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex h-11 rounded-[10px] border border-[var(--border)] bg-white p-1" aria-label="Kalenderweergave">
          {(["day","week","month"] as const).map(item=><Link key={item} href={`/app/calendar?view=${item}&date=${date}`} className={`inline-flex items-center rounded-[7px] px-3 text-xs font-semibold transition ${view===item?"bg-[var(--primary-soft)] text-[var(--primary)]":"text-[var(--muted)] hover:bg-[var(--surface-soft)]"}`}>{item==="day"?"Dag":item==="week"?"Week":"Maand"}</Link>)}
        </div>
        <div className="flex h-11 items-center rounded-[10px] border border-[var(--border)] bg-white">
          <Link aria-label="Vorige periode" href={nav(previousDate)} className="grid h-full w-10 place-items-center border-r border-[var(--border)] text-lg text-[var(--muted)] hover:bg-[var(--surface-soft)]">‹</Link>
          <div className="min-w-[170px] px-3 text-center text-sm font-semibold capitalize">{label}</div>
          <Link aria-label="Volgende periode" href={nav(nextDate)} className="grid h-full w-10 place-items-center border-l border-[var(--border)] text-lg text-[var(--muted)] hover:bg-[var(--surface-soft)]">›</Link>
        </div>
        {date!==today?<Link href={`/app/calendar?view=${view}&date=${today}`} className="inline-flex h-11 items-center rounded-[10px] border border-[var(--border)] bg-white px-3.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)]">Vandaag</Link>:null}
        {canManage&&view==="day"?<Link data-calendar-block-action href={`/app/blocks?date=${date}`} className="inline-flex h-11 items-center rounded-[10px] border border-[var(--border)] bg-white px-3.5 text-sm font-medium hover:bg-[var(--surface-soft)]">Blokkeer tijd</Link>:null}
        {canManage?<Link href="/app/settings/schedule" className="inline-flex h-11 items-center rounded-[10px] border border-[var(--border)] bg-white px-3.5 text-sm font-medium hover:bg-[var(--surface-soft)]">Afwijkingen</Link>:null}
        {canManage?<Link href="/app/calendar/new" className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]"><span className="text-lg leading-none">＋</span>Nieuwe afspraak</Link>:null}
      </div>
    </header>
    {view==="day"
      ?<CalendarDayView salonId={salon.id} timezone={salon.timezone} date={date} today={today} canManage={canManage}/>
      :<CalendarPeriodView salonId={salon.id} timezone={salon.timezone} date={date} view={view} staffFilter={staffFilter}/>}
  </>;
}
