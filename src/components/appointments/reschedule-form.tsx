"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Staff = { id: string; name: string };
type Slot = { start: string };

export function RescheduleForm({ appointmentId, serviceId, staff, initialStaffId, timezone }: { appointmentId: string; serviceId: string; staff: Staff[]; initialStaffId: string; timezone: string }) {
  const router = useRouter();
  const today = useMemo(()=>new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),[timezone]);
  const [date,setDate]=useState(today); const [staffId,setStaffId]=useState(initialStaffId); const [slots,setSlots]=useState<Slot[]>([]); const [startsAt,setStartsAt]=useState(""); const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null);
  useEffect(()=>{const c=new AbortController();setLoading(true);setError(null);setStartsAt("");fetch(`/api/internal/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`,{signal:c.signal}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error);setSlots(p.slots??[])}).catch(e=>{if(e instanceof DOMException&&e.name==="AbortError")return;setError(e instanceof Error?e.message:"Beschikbaarheid kon niet worden geladen.")}).finally(()=>setLoading(false));return()=>c.abort()},[date,serviceId,staffId]);
  async function save(){if(!startsAt)return;setSaving(true);setError(null);try{const r=await fetch("/api/internal/reschedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({appointmentId,staffId,startsAt})});const p=await r.json();if(!r.ok)throw new Error(p.error);router.push(`/app/appointments/${appointmentId}`);router.refresh()}catch(e){setError(e instanceof Error?e.message:"Verplaatsen is niet gelukt.")}finally{setSaving(false)}}
  return <div className="mt-7 grid max-w-xl gap-5"><label className="grid gap-1.5 text-sm font-medium"><span>Medewerker</span><select className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5" value={staffId} onChange={e=>setStaffId(e.target.value)}>{staff.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><Field label="Datum" type="date" min={today} value={date} onChange={e=>setDate(e.target.value)}/><div><p className="mb-2 text-sm font-medium">Tijd</p>{loading?<div className="h-11 animate-pulse rounded-[10px] bg-[#e9e9e5]"/>:<div className="grid grid-cols-4 gap-2">{slots.map(x=><button type="button" key={x.start} onClick={()=>setStartsAt(x.start)} className={`h-10 rounded-[9px] border text-sm ${startsAt===x.start?"border-[var(--primary)] bg-[var(--primary)] text-white":"border-[var(--border)] bg-white"}`}>{new Intl.DateTimeFormat("nl-NL",{hour:"2-digit",minute:"2-digit",timeZone:timezone}).format(new Date(x.start))}</button>)}</div>}</div>{error?<p role="alert" className="text-sm text-[var(--danger)]">{error}</p>:null}<Button size="lg" disabled={!startsAt||saving} onClick={save}>{saving?"Verplaatsen…":"Afspraak verplaatsen"}</Button></div>
}
