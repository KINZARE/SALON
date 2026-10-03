import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getBlocks,getStaff } from "@/services/app-data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createBlock,deleteBlock } from "./actions";

function validDate(value:unknown){
  return typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default async function BlocksPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Geblokkeerde tijd wordt beheerd door owner of manager.</p></div>;

  const query=await searchParams;
  const selectedDate=validDate(query.date)??formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  const selectedStaff=typeof query.staffId==="string"?query.staffId:"";
  const defaultStart=`${selectedDate}T09:00`;
  const defaultEnd=`${selectedDate}T10:00`;
  const [blocks,staff]=await Promise.all([getBlocks(salon.id,new Date().toISOString()),getStaff(salon.id)]);
  const staffMap=new Map(staff.map(member=>[member.id,member.name]));
  const error=typeof query.error==="string"?query.error:null;

  return <div>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Beschikbaarheid</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Tijd blokkeren</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Lunch, vakantie, administratie of sluiting — direct meegenomen in beschikbaarheid.</p></div>
      <a href={`/app/calendar?date=${selectedDate}`} className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)]">← Terug naar Calendar</a>
    </header>
    {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <section className="mt-7 max-w-2xl rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-6">
      <div><h2 className="text-lg font-semibold">Nieuw block</h2><p className="mt-1 text-xs text-[var(--muted)]">De gekozen datum uit Calendar staat alvast klaar.</p></div>
      <form action={createBlock} className="mt-5 grid min-w-0 gap-4">
        <label className="grid min-w-0 gap-1.5 text-sm font-medium"><span>Voor wie?</span><select name="staffId" defaultValue={selectedStaff} className="h-11 min-w-0 w-full max-w-full rounded-[10px] border border-[var(--border)] bg-white px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"><option value="">Hele salon</option>{staff.filter(member=>member.active).map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2"><Field label="Van" name="startsAt" type="datetime-local" defaultValue={defaultStart} required/><Field label="Tot" name="endsAt" type="datetime-local" defaultValue={defaultEnd} required/></div>
        <Field label="Reden (optioneel)" name="reason" placeholder="Lunch, vakantie, privé…" maxLength={160}/>
        <div><Button size="lg">Tijd blokkeren</Button></div>
      </form>
    </section>

    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Komende blocks</h2><span className="text-xs text-[var(--muted)]">{blocks.length} gepland</span></div>
      <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">{blocks.map((block,index)=><div key={block.id} className={`flex items-start justify-between gap-4 px-4 py-4 sm:px-5 ${index?"border-t border-[var(--border)]":""}`}><div className="min-w-0"><p className="font-semibold">{block.staff_id?staffMap.get(block.staff_id)??"Medewerker":"Hele salon"}</p><p className="mt-1 break-words text-sm text-[var(--muted)]">{formatInTimeZone(new Date(block.starts_at),salon.timezone,"dd-MM-yyyy HH:mm")} – {formatInTimeZone(new Date(block.ends_at),salon.timezone,"dd-MM-yyyy HH:mm")}{block.reason?` · ${block.reason}`:""}</p></div><form action={deleteBlock}><input type="hidden" name="id" value={block.id}/><button className="min-h-11 px-2 text-xs font-medium text-[var(--danger)]">Verwijderen</button></form></div>)}{!blocks.length?<p className="px-5 py-8 text-sm text-[var(--muted)]">Geen toekomstige blocks.</p>:null}</div>
    </section>
  </div>;
}
