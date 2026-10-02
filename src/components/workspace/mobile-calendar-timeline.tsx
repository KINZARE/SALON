import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { getStatusMeta } from "@/lib/calendar-ui";
import { getStaffIdentity, type StaffTone } from "@/lib/staff-identity";

type Appointment={id:string;starts_at:string;service_ends_at:string;status:string;customer_name_snapshot:string;service_name_snapshot:string;staff_id:string;customer?:{name:string}|null;staff?:{name:string}|null};
type Staff={id:string;name:string;active:boolean};
type Block={id:string;staff_id:string|null;starts_at:string;ends_at:string;reason:string|null};
type Break={staff_id:string;weekday:number;start_time:string;end_time:string};

const avatar:Record<StaffTone,string>={clay:"bg-[#f4e4da] text-[#8a4a25]",sage:"bg-[#e4ece6] text-[#4f6c57]",sand:"bg-[#f2eadc] text-[#80683f]",sky:"bg-[#e4ecef] text-[#4f7078]",lilac:"bg-[#ece6ef] text-[#6e5d78]"};
const statusDot={info:"bg-[var(--status-checked-in)]",warning:"bg-[var(--status-pending)]",success:"bg-[var(--status-confirmed)]",complete:"bg-[var(--status-completed)]",danger:"bg-[var(--status-no-show)]",muted:"bg-[var(--status-cancelled)]"} as const;

export function MobileCalendarTimeline({date,timezone,appointments,staff,blocks,breaks,canManage}:{date:string;timezone:string;appointments:Appointment[];staff:Staff[];blocks:Block[];breaks:Break[];canManage:boolean}){
  const staffMap=new Map(staff.map(item=>[item.id,item]));
  const rows=appointments.filter(item=>formatInTimeZone(new Date(item.starts_at),timezone,"yyyy-MM-dd")===date).toSorted((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime());
  return <div data-mobile-calendar className="mt-5 md:hidden">
    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Dagplanning</p><span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] ring-1 ring-[var(--border)]">{staff.length} medewerkers</span></div>
    <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white">
      {rows.length ? rows.map((item,index)=>{
        const member=staffMap.get(item.staff_id);
        const identity=getStaffIdentity(item.staff_id,member?.name??item.staff?.name??"M");
        const status=getStatusMeta(item.status);
        const active=!["completed","cancelled","no_show"].includes(item.status);
        return <div key={item.id} className={`grid grid-cols-[54px_36px_minmax(0,1fr)] gap-3 px-4 py-4 ${index?"border-t border-[var(--border)]":""}`}>
          <time className="pt-1 text-sm font-semibold tabular-nums">{formatInTimeZone(new Date(item.starts_at),timezone,"HH:mm")}</time>
          <span className={`grid h-9 w-9 place-items-center rounded-full text-[10px] font-bold ${avatar[identity.tone]}`}>{identity.initials}</span>
          <div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><Link href={`/app/appointments/${item.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold">{item.customer?.name??item.customer_name_snapshot}</Link><span className={`h-2 w-2 shrink-0 rounded-full ${statusDot[status.tone]}`} title={status.label}/></div><p className="mt-1 truncate text-xs text-[var(--muted)]">{item.service_name_snapshot} · {member?.name??item.staff?.name??"Medewerker"}</p>{canManage&&active?<Link href={`/app/appointments/${item.id}/reschedule`} className="mt-2 inline-flex min-h-8 items-center rounded-full border border-[var(--border)] px-3 text-[11px] font-medium text-[var(--muted)]">Verplaats</Link>:null}</div>
        </div>;
      }):<p className="px-5 py-8 text-center text-sm text-[var(--muted)]">Geen afspraken op deze dag.</p>}
    </div>
    {(breaks.length||blocks.length)?<section className="mt-5"><h2 className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Niet beschikbaar</h2><div className="mt-2 grid gap-2">{breaks.slice(0,4).map((item,index)=><div key={`break-${item.staff_id}-${index}`} className="rounded-[16px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-3 text-xs"><span className="font-semibold">{staffMap.get(item.staff_id)?.name??"Medewerker"}</span><span className="ml-2 text-[var(--muted)]">Pauze {item.start_time.slice(0,5)}–{item.end_time.slice(0,5)}</span></div>)}{blocks.slice(0,4).map(block=><div key={block.id} className="rounded-[16px] border border-[#e7d8ca] bg-[#fbf4ed] px-4 py-3 text-xs"><span className="font-semibold">{block.staff_id?staffMap.get(block.staff_id)?.name??"Medewerker":"Hele salon"}</span><span className="ml-2 text-[var(--muted)]">{block.reason||"Geblokkeerd"}</span></div>)}</div></section>:null}
  </div>;
}