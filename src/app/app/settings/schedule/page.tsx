import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getStaff } from "@/services/app-data";
import { getOpeningExceptions,getStaffScheduleOverrides } from "@/services/product-completion";
import { deleteOpeningException,deleteStaffOverride,saveOpeningException,saveStaffOverride } from "./actions";

export default async function ScheduleSettingsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <div><h1 className="text-3xl font-semibold">Geen toegang</h1></div>;
  const today=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  const [exceptions,overrides,staff,query]=await Promise.all([getOpeningExceptions(salon.id,today),getStaffScheduleOverrides(salon.id,today),getStaff(salon.id),searchParams]);
  const error=typeof query.error==="string"?query.error:null;
  const staffNames=new Map(staff.map(member=>[member.id,member.name]));

  const inputClass="h-11 min-w-0 rounded-[10px] border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";

  return <div>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href="/app/settings" className="text-xs font-semibold text-[var(--primary)]">← Settings</Link><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Afwijkende opening & shifts</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Datumregels gaan vóór het weekrooster. Bestaande afspraken worden nooit stil ongeldig gemaakt.</p></div>
      <Link href="/app/calendar?view=month" className="inline-flex h-11 items-center rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-medium hover:bg-[var(--surface-soft)]">Bekijk maand</Link>
    </header>
    {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <div className="mt-7 grid gap-6 xl:grid-cols-2">
      <section className="rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
        <h2 className="font-semibold">Salonopening op datum</h2><p className="mt-1 text-xs text-[var(--muted)]">Voor feestdagen, extra open dagen of een kortere dag.</p>
        <form action={saveOpeningException} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium"><span>Datum</span><input name="date" type="date" min={today} required className={inputClass}/></label>
          <label className="flex min-h-11 items-end gap-2 pb-2 text-sm"><input name="isOpen" type="checkbox" defaultChecked/> Open op deze dag</label>
          <label className="grid gap-1.5 text-sm font-medium"><span>Vanaf</span><input name="start" type="time" defaultValue="09:00" className={inputClass}/></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>Tot</span><input name="end" type="time" defaultValue="18:00" className={inputClass}/></label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Notitie</span><input name="note" maxLength={240} placeholder="Bijv. Kerstavond" className={inputClass}/></label>
          <button className="h-11 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] sm:col-span-2">Afwijking opslaan</button>
        </form>
        <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">{exceptions.map(item=><div key={item.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="text-sm font-semibold">{new Intl.DateTimeFormat("nl-NL",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${item.exception_date}T12:00:00Z`))}</p><p className="mt-0.5 truncate text-xs text-[var(--muted)]">{item.is_open?`${item.start_time?.slice(0,5)}–${item.end_time?.slice(0,5)}`:"Gesloten"}{item.note?` · ${item.note}`:""}</p></div>
          <form action={deleteOpeningException}><input type="hidden" name="date" value={item.exception_date}/><button className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Weekrooster</button></form>
        </div>)}{!exceptions.length?<p className="py-5 text-sm text-[var(--muted)]">Geen toekomstige uitzonderingen.</p>:null}</div>
      </section>

      <section className="rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
        <h2 className="font-semibold">Medewerker op datum</h2><p className="mt-1 text-xs text-[var(--muted)]">Voor vrije dagen, vakantie, extra werken of eerder stoppen.</p>
        <form action={saveStaffOverride} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Medewerker</span><select name="staffId" required className={inputClass}><option value="">Kies medewerker</option>{staff.filter(member=>member.active).map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>Datum</span><input name="date" type="date" min={today} required className={inputClass}/></label>
          <label className="flex min-h-11 items-end gap-2 pb-2 text-sm"><input name="isWorking" type="checkbox" defaultChecked/> Werkt deze dag</label>
          <label className="grid gap-1.5 text-sm font-medium"><span>Vanaf</span><input name="start" type="time" defaultValue="09:00" className={inputClass}/></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>Tot</span><input name="end" type="time" defaultValue="18:00" className={inputClass}/></label>
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Reden</span><input name="reason" maxLength={240} placeholder="Bijv. Vakantie" className={inputClass}/></label>
          <button className="h-11 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] sm:col-span-2">Shift opslaan</button>
        </form>
        <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">{overrides.map(item=><div key={item.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="text-sm font-semibold">{staffNames.get(item.staff_id)??"Medewerker"} · {new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${item.override_date}T12:00:00Z`))}</p><p className="mt-0.5 truncate text-xs text-[var(--muted)]">{item.is_working?`${item.start_time?.slice(0,5)}–${item.end_time?.slice(0,5)}`:"Vrij"}{item.reason?` · ${item.reason}`:""}</p></div>
          <form action={deleteStaffOverride}><input type="hidden" name="staffId" value={item.staff_id}/><input type="hidden" name="date" value={item.override_date}/><button className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Weekrooster</button></form>
        </div>)}{!overrides.length?<p className="py-5 text-sm text-[var(--muted)]">Geen toekomstige shift-afwijkingen.</p>:null}</div>
      </section>
    </div>
  </div>;
}
