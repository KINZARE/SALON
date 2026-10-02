import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

type Appointment={id:string;starts_at:string;status:string;customer_name_snapshot:string;service_name_snapshot:string;staff_id:string;staff:{name:string}|null};
type Opening={weekday:number;is_open:boolean;start_time:string|null;end_time:string|null};
type Exception={exception_date:string;is_open:boolean;start_time:string|null;end_time:string|null};

export function WeekCalendarOverview({dates,appointments,timezone}:{dates:string[];appointments:Appointment[];timezone:string}){
  const byDate=new Map<string,Appointment[]>();
  for(const item of appointments){const date=formatInTimeZone(new Date(item.starts_at),timezone,"yyyy-MM-dd");byDate.set(date,[...(byDate.get(date)??[]),item])}
  return <div data-calendar-week className="mt-6 grid gap-3 lg:grid-cols-7">{dates.map(date=>{
    const day=new Date(`${date}T12:00:00Z`);const items=byDate.get(date)??[];
    return <section key={date} className="min-w-0 rounded-[18px] border border-[var(--border)] bg-white p-3.5">
      <Link href={`/app/calendar?view=day&date=${date}`} className="block rounded-[10px] focus:outline-none focus:ring-4 focus:ring-[var(--primary-soft)]">
        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--muted)]">{new Intl.DateTimeFormat("nl-NL",{weekday:"short",timeZone:"UTC"}).format(day)}</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-2"><strong className="text-lg">{new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(day)}</strong><span className="text-[11px] text-[var(--muted)]">{items.length}</span></div>
      </Link>
      <div className="mt-3 grid gap-2">
        {items.slice(0,7).map(item=><Link key={item.id} href={`/app/calendar/${item.id}`} className="rounded-[12px] bg-[var(--surface-soft)] p-2.5 hover:bg-[var(--primary-soft)]">
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{formatInTimeZone(new Date(item.starts_at),timezone,"HH:mm")}</span><span className="text-[9px] text-[var(--muted)]">{item.status}</span></div>
          <p className="mt-1 truncate text-xs font-medium">{item.customer_name_snapshot}</p><p className="truncate text-[10px] text-[var(--muted)]">{item.service_name_snapshot} · {item.staff?.name??"—"}</p>
        </Link>)}
        {items.length>7?<Link href={`/app/calendar?view=day&date=${date}`} className="text-xs font-medium text-[var(--accent-dark)]">+ {items.length-7} meer</Link>:null}
        {!items.length?<p className="py-3 text-xs text-[var(--muted)]">Geen afspraken</p>:null}
      </div>
    </section>;
  })}</div>;
}

export function MonthCalendarOverview({dates,month,appointments,timezone,opening,exceptions}:{dates:string[];month:string;appointments:Appointment[];timezone:string;opening:Opening[];exceptions:Exception[]}){
  const counts=new Map<string,number>();for(const item of appointments){if(item.status==="cancelled")continue;const date=formatInTimeZone(new Date(item.starts_at),timezone,"yyyy-MM-dd");counts.set(date,(counts.get(date)??0)+1)}
  const openingMap=new Map(opening.map(row=>[row.weekday,row]));const exceptionMap=new Map(exceptions.map(row=>[row.exception_date,row]));
  const status=(date:string)=>{const day=new Date(`${date}T12:00:00Z`);const exception=exceptionMap.get(date);const weekly=openingMap.get(day.getUTCDay());return{exception,isOpen:exception?exception.is_open:Boolean(weekly?.is_open),day}};
  return <>
    <div className="mt-6 hidden grid-cols-7 gap-2 md:grid" data-calendar-month>
      {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(label=><div key={label} className="px-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[var(--muted)]">{label}</div>)}
      {dates.map(date=>{const {exception,isOpen,day}=status(date);const outside=date.slice(0,7)!==month;const count=counts.get(date)??0;return <Link key={date} href={`/app/calendar?view=day&date=${date}`} className={`min-h-[118px] rounded-[15px] border p-3 transition hover:border-[var(--accent-light)] hover:bg-[var(--surface-soft)] ${outside?"border-transparent bg-transparent opacity-45":"border-[var(--border)] bg-white"}`}>
        <div className="flex items-start justify-between"><span className="text-sm font-semibold">{day.getUTCDate()}</span>{exception?<span className="h-2 w-2 rounded-full bg-[var(--accent)]"/>:null}</div>
        <div className="mt-7"><p className="text-xl font-semibold tracking-[-.04em]">{count}</p><p className="text-[10px] text-[var(--muted)]">{count===1?"afspraak":"afspraken"}</p></div>
        {!isOpen?<p className="mt-2 text-[10px] font-medium text-[var(--muted)]">Gesloten</p>:exception?<p className="mt-2 text-[10px] font-medium text-[var(--accent-dark)]">Afwijkend open</p>:null}
      </Link>})}
    </div>
    <div className="mt-6 grid gap-2 md:hidden">
      {dates.filter(date=>date.slice(0,7)===month).map(date=>{const {exception,isOpen,day}=status(date);const count=counts.get(date)??0;return <Link key={date} href={`/app/calendar?view=day&date=${date}`} className="flex min-h-14 items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-white px-4">
        <div><p className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat("nl-NL",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}).format(day)}</p><p className="text-[10px] text-[var(--muted)]">{!isOpen?"Gesloten":exception?"Afwijkende opening":"Normale opening"}</p></div><span className="text-sm font-semibold">{count}</span>
      </Link>})}
    </div>
  </>;
}
