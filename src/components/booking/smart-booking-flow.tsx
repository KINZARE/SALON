"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";

type Staff={id:string;name:string};
type Slot={start:string;serviceEnd:string;staffIds:string[]};

function datesBetween(start:string,end:string){
  const first=new Date(`${start}T12:00:00Z`);
  const last=new Date(`${end}T12:00:00Z`);
  const values=[];
  for(let current=first;current<=last;current=new Date(current.getTime()+86_400_000)){
    values.push({value:current.toISOString().slice(0,10),weekday:new Intl.DateTimeFormat("nl-NL",{weekday:"short",timeZone:"UTC"}).format(current),day:new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(current)});
  }
  return values;
}

export function SmartBookingFlow({token,salon,service,staff,lockedStaffId,startDate,endDate}:{token:string;salon:{name:string;timezone:string};service:{name:string;durationMinutes:number;priceCents:number;currency:string;description:string|null};staff:Staff[];lockedStaffId:string|null;startDate:string;endDate:string}){
  const dates=useMemo(()=>datesBetween(startDate,endDate),[startDate,endDate]);
  const [date,setDate]=useState(startDate);
  const [staffId,setStaffId]=useState<string|null>(lockedStaffId);
  const [slots,setSlots]=useState<Slot[]>([]);
  const [slot,setSlot]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [appointmentId,setAppointmentId]=useState<string|null>(null);

  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError(null);setSlot(null);
    fetch(`/api/book-link/${encodeURIComponent(token)}/availability?date=${encodeURIComponent(date)}`,{signal:controller.signal})
      .then(async response=>{const body=await response.json() as {slots?:Slot[];error?:string};if(!response.ok)throw new Error(body.error??"Beschikbaarheid kon niet worden geladen.");setSlots(body.slots??[])})
      .catch(err=>{if(err instanceof DOMException&&err.name==="AbortError")return;setSlots([]);setError(err instanceof Error?err.message:"Beschikbaarheid kon niet worden geladen.")})
      .finally(()=>setLoading(false));
    return()=>controller.abort();
  },[date,token]);

  const visibleSlots=staffId?slots.filter(item=>item.staffIds.includes(staffId)):slots;
  const selectedStaff=lockedStaffId?staff.find(member=>member.id===lockedStaffId):staff.find(member=>member.id===staffId);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!slot)return;
    const data=new FormData(event.currentTarget);
    setSubmitting(true);setError(null);
    const response=await fetch(`/api/book-link/${encodeURIComponent(token)}/book`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startsAt:slot,staffId,customer:{name:data.get("name"),phone:data.get("phone"),email:data.get("email"),note:data.get("note")}})});
    const body=await response.json() as {appointmentId?:string;error?:string};
    setSubmitting(false);
    if(!response.ok||!body.appointmentId){setError(body.error??"Boeken is niet gelukt.");return;}
    setAppointmentId(body.appointmentId);
  }

  if(appointmentId)return <section className="py-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--primary-soft)] text-xl text-[var(--accent-dark)]">✓</div><h1 className="mt-5 text-2xl font-semibold tracking-[-.04em]">Je afspraak staat gepland</h1><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{salon.name} heeft je afspraak ontvangen.</p><p className="mt-4 text-xs text-[var(--muted)]">Referentie {appointmentId.slice(0,8).toUpperCase()}</p></section>;

  return <div>
    <section className="rounded-[24px] border border-[var(--border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--accent)]">Voor jou klaargezet</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-.04em]">{service.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{service.durationMinutes} min · {formatMoney(service.priceCents,service.currency)}{service.description?` · ${service.description}`:""}</p>
      {lockedStaffId&&selectedStaff?<p className="mt-4 rounded-[14px] bg-[var(--surface-soft)] px-3.5 py-3 text-sm">Met <strong>{selectedStaff.name}</strong></p>:null}
    </section>

    {!lockedStaffId&&staff.length>1?<section className="mt-6"><h2 className="text-sm font-semibold">Heb je een voorkeur?</h2><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={()=>setStaffId(null)} className={`min-h-10 rounded-full border px-3.5 text-sm ${staffId===null?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-[var(--border)] bg-white"}`}>Geen voorkeur</button>{staff.map(member=><button type="button" key={member.id} onClick={()=>setStaffId(member.id)} className={`min-h-10 rounded-full border px-3.5 text-sm ${staffId===member.id?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-[var(--border)] bg-white"}`}>{member.name}</button>)}</div></section>:null}

    <section className="mt-6"><h2 className="text-sm font-semibold">Kies een datum</h2><div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2">{dates.map(item=><button type="button" key={item.value} onClick={()=>setDate(item.value)} className={`min-w-[78px] rounded-[14px] border px-3 py-3 text-center ${date===item.value?"border-[#dec2b0] bg-[var(--primary-soft)]":"border-[var(--border)] bg-white"}`}><span className="block text-xs capitalize text-[var(--muted)]">{item.weekday}</span><span className="mt-0.5 block text-sm font-semibold">{item.day}</span></button>)}</div></section>

    <section className="mt-5"><h2 className="text-sm font-semibold">Kies een tijd</h2><div className="mt-2 grid min-h-12 grid-cols-3 gap-2">{loading?<p className="col-span-3 py-4 text-sm text-[var(--muted)]">Tijden laden…</p>:visibleSlots.length?visibleSlots.map(item=><button type="button" key={item.start} onClick={()=>setSlot(item.start)} className={`h-11 rounded-[12px] border text-sm font-medium ${slot===item.start?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-[var(--border)] bg-white"}`}>{new Intl.DateTimeFormat("nl-NL",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:salon.timezone}).format(new Date(item.start))}</button>):<p className="col-span-3 py-4 text-sm text-[var(--muted)]">Geen tijden op deze dag. Kies een andere datum.</p>}</div></section>

    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-[24px] border border-[var(--border)] bg-white p-5">
      <div><h2 className="text-lg font-semibold">Je gegevens</h2><p className="mt-1 text-xs text-[var(--muted)]">Kies eerst een tijd; daarna bevestig je de afspraak.</p></div>
      <Field label="Naam" name="name" required autoComplete="name"/>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Telefoon" name="phone" type="tel" required autoComplete="tel"/><Field label="E-mail" name="email" type="email" required autoComplete="email"/></div>
      <TextAreaField label="Notitie (optioneel)" name="note" rows={3}/>
      {error?<p role="alert" className="rounded-[12px] bg-[#fbefed] p-3 text-sm text-[var(--danger)]">{error}</p>:null}
      <Button size="lg" disabled={!slot||submitting}>{submitting?"Afspraak vastleggen…":"Afspraak bevestigen"}</Button>
    </form>
  </div>;
}
