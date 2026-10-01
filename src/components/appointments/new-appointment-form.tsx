"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";

type Service={id:string;name:string;duration_minutes:number};
type Staff={id:string;name:string};
type Slot={start:string};
type Customer={id:string;name:string;phone:string|null;email:string|null};

export function NewAppointmentForm({services,staffByService,timezone}:{services:Service[];staffByService:Record<string,Staff[]>;timezone:string}) {
  const router=useRouter();
  const [serviceId,setServiceId]=useState(services[0]?.id??"");
  const staff=staffByService[serviceId]??[];
  const [staffId,setStaffId]=useState(staff[0]?.id??"");
  const today=useMemo(()=>new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),[timezone]);
  const [date,setDate]=useState(today);const [slots,setSlots]=useState<Slot[]>([]);const [startsAt,setStartsAt]=useState("");const [loading,setLoading]=useState(false);const [saving,setSaving]=useState(false);const [error,setError]=useState<string|null>(null);
  const [query,setQuery]=useState("");const [results,setResults]=useState<Customer[]>([]);const [searching,setSearching]=useState(false);
  const [customerId,setCustomerId]=useState("");const [customerName,setCustomerName]=useState("");const [customerPhone,setCustomerPhone]=useState("");const [customerEmail,setCustomerEmail]=useState("");
  const dirty=Boolean(startsAt||customerName||customerPhone||customerEmail);

  useEffect(()=>{const next=(staffByService[serviceId]??[])[0]?.id??"";setStaffId(next);setStartsAt("")},[serviceId,staffByService]);
  useEffect(()=>{if(!dirty)return;const handler=(event:BeforeUnloadEvent)=>{event.preventDefault()};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler)},[dirty]);
  useEffect(()=>{if(query.trim().length<2||customerId){setResults([]);return}const controller=new AbortController();const timer=window.setTimeout(()=>{setSearching(true);fetch(`/api/internal/customers?q=${encodeURIComponent(query.trim())}`,{signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error);setResults(body.customers??[])}).catch(error=>{if(!(error instanceof DOMException&&error.name==="AbortError"))setResults([])}).finally(()=>setSearching(false))},220);return()=>{window.clearTimeout(timer);controller.abort()}},[query,customerId]);

  function chooseCustomer(customer:Customer){setCustomerId(customer.id);setQuery(customer.name);setCustomerName(customer.name);setCustomerPhone(customer.phone??"");setCustomerEmail(customer.email??"");setResults([])}
  function newCustomer(){setCustomerId("");setQuery("");setCustomerName("");setCustomerPhone("");setCustomerEmail("");setResults([])}

  useEffect(()=>{if(!serviceId||!staffId||!date){setSlots([]);return}const controller=new AbortController();setLoading(true);setError(null);setStartsAt("");fetch(`/api/internal/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`,{signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error);setSlots(body.slots??[])}).catch(error=>{if(error instanceof DOMException&&error.name==="AbortError")return;setError(error instanceof Error?error.message:"Beschikbaarheid kon niet worden geladen.");setSlots([])}).finally(()=>setLoading(false));return()=>controller.abort()},[date,serviceId,staffId]);

  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!startsAt)return;const data=new FormData(event.currentTarget);setSaving(true);setError(null);try{const response=await fetch("/api/internal/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({serviceId,staffId,startsAt,customerId:customerId||null,customer:{name:data.get("name"),phone:data.get("phone"),email:data.get("email"),note:data.get("note")}})});const body=await response.json();if(!response.ok)throw new Error(body.error);router.push(`/app/appointments/${body.appointmentId}`);router.refresh()}catch(error){setError(error instanceof Error?error.message:"Opslaan is niet gelukt.")}finally{setSaving(false)}}

  return <form onSubmit={submit} className="mt-7 grid max-w-xl gap-5">
    <label className="grid gap-1.5 text-sm font-medium"><span>Behandeling</span><select value={serviceId} onChange={event=>setServiceId(event.target.value)} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5">{services.map(item=><option key={item.id} value={item.id}>{item.name} · {item.duration_minutes} min</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium"><span>Medewerker</span><select value={staffId} onChange={event=>setStaffId(event.target.value)} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5">{staff.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <Field label="Datum" type="date" value={date} min={today} onChange={event=>setDate(event.target.value)} required/>
    <div><p className="mb-2 text-sm font-medium">Tijd</p>{loading?<div className="h-11 animate-pulse rounded-[10px] bg-[#e9e9e5]"/>:<div className="grid grid-cols-4 gap-2">{slots.map(item=><button key={item.start} type="button" onClick={()=>setStartsAt(item.start)} className={`h-10 rounded-[9px] border text-sm ${startsAt===item.start?"border-[var(--primary)] bg-[var(--primary)] text-white":"border-[var(--border)] bg-white"}`}>{new Intl.DateTimeFormat("nl-NL",{hour:"2-digit",minute:"2-digit",timeZone:timezone}).format(new Date(item.start))}</button>)}</div>}{!loading&&!slots.length?<p className="text-sm text-[var(--muted)]">Geen beschikbare tijden voor deze combinatie.</p>:null}</div>
    <div className="border-t border-[var(--border)] pt-5"><label className="grid gap-1.5 text-sm font-medium"><span>Zoek bestaande klant</span><input value={query} onChange={event=>{setQuery(event.target.value);if(customerId&&event.target.value!==customerName)newCustomer()}} placeholder="Naam, telefoon of e-mail" className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5"/><span className="text-xs font-normal text-[var(--muted)]">{searching?"Zoeken…":customerId?"Bestaande klant geselecteerd. Contactvelden zijn vergrendeld.":"Typ minimaal 2 tekens of vul hieronder een nieuwe klant in."}</span></label>
      {results.length?<div className="mt-2 overflow-hidden rounded-[11px] border border-[var(--border)] bg-white">{results.map(customer=><button key={customer.id} type="button" onClick={()=>chooseCustomer(customer)} className="block w-full border-b border-[var(--border)] px-3.5 py-3 text-left last:border-0"><span className="block text-sm font-semibold">{customer.name}</span><span className="mt-0.5 block text-xs text-[var(--muted)]">{[customer.phone,customer.email].filter(Boolean).join(" · ")}</span></button>)}</div>:null}
      {customerId?<button type="button" onClick={newCustomer} className="mt-2 text-xs font-medium text-[var(--primary)]">Andere / nieuwe klant</button>:null}
      <div className="mt-4 grid gap-4"><Field label="Klantnaam" name="name" value={customerName} readOnly={Boolean(customerId)} onChange={event=>setCustomerName(event.target.value)} required/><Field label="Telefoon (optioneel)" name="phone" type="tel" value={customerPhone} readOnly={Boolean(customerId)} onChange={event=>setCustomerPhone(event.target.value)}/><Field label="E-mail (optioneel)" name="email" type="email" value={customerEmail} readOnly={Boolean(customerId)} onChange={event=>setCustomerEmail(event.target.value)}/><TextAreaField label="Notitie (optioneel)" name="note"/></div>
    </div>
    {error?<p role="alert" className="text-sm text-[var(--danger)]">{error}</p>:null}<Button size="lg" disabled={!startsAt||saving}>{saving?"Opslaan…":"Afspraak opslaan"}</Button>
  </form>
}
