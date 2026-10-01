import Link from "next/link";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getAppointmentsForDate, getBlocks, getOpeningHours, getStaff } from "@/services/app-data";
import { getCalendarBreaks } from "@/services/workspace-data";
import { CalendarBoard } from "@/components/workspace/calendar-board";

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
  const canManage=["owner","manager"].includes(membership.role);

  return <>
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Calendar</h1><p className="mt-1 text-sm text-[var(--muted)]">Dagplanning · server-gevalideerd verplaatsen</p></div>{canManage?<Link href="/app/calendar/new" className="rounded-[11px] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white">+ Afspraak</Link>:null}</header>
    <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">{days.map(value=>{const d=new Date(`${value}T12:00:00Z`);return <Link key={value} href={`/app/calendar?date=${value}`} className={`min-w-[72px] rounded-[11px] border px-3 py-2.5 text-center ${value===date?"border-[var(--primary)] bg-[var(--primary-soft)]":"border-[var(--border)] bg-white"}`}><span className="block text-xs capitalize text-[var(--muted)]">{new Intl.DateTimeFormat("nl-NL",{weekday:"short",timeZone:"UTC"}).format(d)}</span><span className="mt-0.5 block text-sm font-semibold">{new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(d)}</span></Link>})}</div>
    <CalendarBoard date={date} timezone={salon.timezone} appointments={appointments} staff={staff} blocks={blocks} breaks={breaks} canManage={canManage} startMinute={startMinute} endMinute={endMinute}/>
  </>;
}
