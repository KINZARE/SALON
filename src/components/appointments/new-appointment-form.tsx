"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";

type Service = { id: string; name: string; duration_minutes: number };
type Staff = { id: string; name: string };
type Slot = { start: string };
type Customer = { id: string; name: string; phone: string | null; email: string | null };

export function NewAppointmentForm({ services, staffByService, customers, timezone }: { services: Service[]; staffByService: Record<string, Staff[]>; customers: Customer[]; timezone: string }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const staff = staffByService[serviceId] ?? [];
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const today = useMemo(() => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()), [timezone]);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => { const next = (staffByService[serviceId] ?? [])[0]?.id ?? ""; setStaffId(next); setStartsAt(""); }, [serviceId, staffByService]);
  function chooseCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    setCustomerName(customer?.name ?? "");
    setCustomerPhone(customer?.phone ?? "");
    setCustomerEmail(customer?.email ?? "");
  }
  useEffect(() => {
    if (!serviceId || !staffId || !date) { setSlots([]); return; }
    const controller = new AbortController(); setLoading(true); setError(null); setStartsAt("");
    fetch(`/api/internal/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`, { signal: controller.signal })
      .then(async r => { const p=await r.json(); if(!r.ok) throw new Error(p.error); setSlots(p.slots??[]); })
      .catch(e=>{ if(e instanceof DOMException&&e.name==="AbortError")return; setError(e instanceof Error?e.message:"Beschikbaarheid kon niet worden geladen."); setSlots([]); })
      .finally(()=>setLoading(false));
    return ()=>controller.abort();
  }, [date, serviceId, staffId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!startsAt)return; const data=new FormData(event.currentTarget); setSaving(true); setError(null);
    try { const r=await fetch("/api/internal/book",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({serviceId,staffId,startsAt,customerId:customerId || null,customer:{name:data.get("name"),phone:data.get("phone"),email:data.get("email"),note:data.get("note")}})}); const p=await r.json(); if(!r.ok)throw new Error(p.error); router.push(`/app/appointments/${p.appointmentId}`); router.refresh(); }
    catch(e){setError(e instanceof Error?e.message:"Opslaan is niet gelukt.");} finally{setSaving(false);}
  }

  return <form onSubmit={submit} className="mt-7 grid max-w-xl gap-5">
    <label className="grid gap-1.5 text-sm font-medium"><span>Behandeling</span><select value={serviceId} onChange={e=>setServiceId(e.target.value)} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5">{services.map(x=><option key={x.id} value={x.id}>{x.name} · {x.duration_minutes} min</option>)}</select></label>
    <label className="grid gap-1.5 text-sm font-medium"><span>Medewerker</span><select value={staffId} onChange={e=>setStaffId(e.target.value)} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5">{staff.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <Field label="Datum" type="date" value={date} min={today} onChange={e=>setDate(e.target.value)} required />
    <div><p className="mb-2 text-sm font-medium">Tijd</p>{loading?<div className="h-11 animate-pulse rounded-[10px] bg-[#e9e9e5]"/>:<div className="grid grid-cols-4 gap-2">{slots.map(x=><button key={x.start} type="button" onClick={()=>setStartsAt(x.start)} className={`h-10 rounded-[9px] border text-sm ${startsAt===x.start?"border-[var(--primary)] bg-[var(--primary)] text-white":"border-[var(--border)] bg-white"}`}>{new Intl.DateTimeFormat("nl-NL",{hour:"2-digit",minute:"2-digit",timeZone:timezone}).format(new Date(x.start))}</button>)}</div>}{!loading&&!slots.length?<p className="text-sm text-[var(--muted)]">Geen beschikbare tijden voor deze combinatie.</p>:null}</div>
    <div className="border-t border-[var(--border)] pt-5"><div className="grid gap-4"><label className="grid gap-1.5 text-sm font-medium"><span>Bestaande klant</span><select value={customerId} onChange={(event)=>chooseCustomer(event.target.value)} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5"><option value="">Nieuwe klant</option>{customers.map((customer)=><option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ""}</option>)}</select></label><Field label="Klantnaam" name="name" value={customerName} onChange={(event)=>setCustomerName(event.target.value)} required /><Field label="Telefoon (optioneel)" name="phone" type="tel" value={customerPhone} onChange={(event)=>setCustomerPhone(event.target.value)} /><Field label="E-mail (optioneel)" name="email" type="email" value={customerEmail} onChange={(event)=>setCustomerEmail(event.target.value)} /><TextAreaField label="Notitie (optioneel)" name="note" /></div></div>
    {error?<p role="alert" className="text-sm text-[var(--danger)]">{error}</p>:null}<Button size="lg" disabled={!startsAt||saving}>{saving?"Opslaan…":"Afspraak opslaan"}</Button>
  </form>;
}
