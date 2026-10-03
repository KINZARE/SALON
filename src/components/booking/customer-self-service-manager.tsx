"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Staff={id:string;name:string};
type Slot={start:string;serviceEnd:string;staffIds:string[]};

export function CustomerSelfServiceManager({token,staff,initialStaffId,initialDate,canChange,cutoffLabel}:{token:string;staff:Staff[];initialStaffId:string;initialDate:string;canChange:boolean;cutoffLabel:string}){
  const router=useRouter();
  const [staffId,setStaffId]=useState(initialStaffId);
  const [date,setDate]=useState(initialDate);
  const [slots,setSlots]=useState<Slot[]>([]);
  const [selected,setSelected]=useState("");
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  useEffect(()=>{
    if(!canChange||!date||!staffId)return;
    const controller=new AbortController();
    setLoading(true);setMessage(null);setSelected("");
    fetch(`/api/self-service/${encodeURIComponent(token)}/availability?date=${encodeURIComponent(date)}&staffId=${encodeURIComponent(staffId)}`,{signal:controller.signal})
      .then(async response=>{const body=await response.json() as {slots?:Slot[];error?:string};if(!response.ok)throw new Error(body.error??"Beschikbaarheid kon niet worden geladen.");setSlots(body.slots??[])})
      .catch(error=>{if(error instanceof DOMException&&error.name==="AbortError")return;setSlots([]);setMessage(error instanceof Error?error.message:"Beschikbaarheid kon niet worden geladen.");})
      .finally(()=>setLoading(false));
    return()=>controller.abort();
  },[canChange,date,staffId,token]);

  const visibleSlots=useMemo(()=>slots.filter(slot=>slot.staffIds.includes(staffId)),[slots,staffId]);

  async function reschedule(){
    if(!selected)return;
    setSaving(true);setMessage(null);
    const response=await fetch(`/api/self-service/${encodeURIComponent(token)}/reschedule`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({staffId,startsAt:selected})});
    const body=await response.json() as {error?:string};
    setSaving(false);
    if(!response.ok){setMessage(body.error??"Verplaatsen is niet gelukt.");return;}
    setMessage("Je afspraak is verplaatst.");
    router.refresh();
  }

  async function cancel(){
    if(!window.confirm("Weet je zeker dat je deze afspraak wilt annuleren?"))return;
    setSaving(true);setMessage(null);
    const response=await fetch(`/api/self-service/${encodeURIComponent(token)}/cancel`,{method:"POST"});
    const body=await response.json() as {error?:string};
    setSaving(false);
    if(!response.ok){setMessage(body.error??"Annuleren is niet gelukt.");return;}
    setMessage("Je afspraak is geannuleerd.");
    router.refresh();
  }

  if(!canChange)return <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"><p className="text-sm font-semibold">Online wijzigen is niet meer beschikbaar.</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Neem contact op met de salon als je hulp nodig hebt.</p></div>;

  const inputClass="h-11 min-w-0 rounded-[10px] border border-[var(--border)] bg-white px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";
  return <section className="mt-7 rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
    <div><h2 className="text-lg font-semibold">Afspraak wijzigen</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Je kunt online wijzigen tot {cutoffLabel}. Beschikbaarheid wordt live gecontroleerd.</p></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium"><span>Medewerker</span><select value={staffId} onChange={event=>setStaffId(event.target.value)} className={inputClass}>{staff.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Datum</span><input type="date" value={date} min={new Date().toISOString().slice(0,10)} onChange={event=>setDate(event.target.value)} className={inputClass}/></label>
    </div>
    <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-[.1em] text-[var(--muted)]">Beschikbare tijden</p><div className="mt-2 flex flex-wrap gap-2">{loading?<span className="text-sm text-[var(--muted)]">Tijden laden…</span>:visibleSlots.length?visibleSlots.map(slot=>{const label=new Intl.DateTimeFormat("nl-NL",{hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(slot.start));return <button type="button" key={slot.start} onClick={()=>setSelected(slot.start)} className={`min-h-10 rounded-[10px] border px-3.5 text-sm font-medium ${selected===slot.start?"border-[var(--primary)] bg-[var(--primary)] text-white":"border-[var(--border)] bg-white hover:bg-[var(--surface-soft)]"}`}>{label}</button>}):<span className="text-sm text-[var(--muted)]">Geen vrije tijden gevonden.</span>}</div></div>
    {message?<p role="status" className="mt-4 rounded-[10px] bg-[var(--surface-soft)] p-3 text-sm">{message}</p>:null}
    <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={!selected||saving} onClick={reschedule} className="min-h-11 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-dark)] disabled:opacity-40">Verplaats afspraak</button><button type="button" disabled={saving} onClick={cancel} className="min-h-11 rounded-[10px] border border-[#e8c8c3] bg-white px-4 text-sm font-medium text-[var(--danger)] disabled:opacity-40">Afspraak annuleren</button></div>
  </section>;
}
