"use client";

import { useMemo, useState } from "react";

type Service={id:string;name:string;staff_ids:string[]};
type Staff={id:string;name:string;active:boolean};

export function SmartBookingLinkCreator({services,staff,today}:{services:Service[];staff:Staff[];today:string}){
  const [serviceId,setServiceId]=useState(services[0]?.id??"");
  const [staffId,setStaffId]=useState("");
  const [startDate,setStartDate]=useState(today);
  const [endDate,setEndDate]=useState(today);
  const [url,setUrl]=useState("");
  const [message,setMessage]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const service=services.find(item=>item.id===serviceId);
  const eligible=useMemo(()=>staff.filter(member=>member.active&&service?.staff_ids.includes(member.id)),[service,staff]);

  async function create(){
    setBusy(true);setMessage(null);setUrl("");
    const response=await fetch("/api/internal/booking-links",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({serviceId,staffId:staffId||null,startDate,endDate})});
    const body=await response.json() as {path?:string;error?:string};
    setBusy(false);
    if(!response.ok||!body.path){setMessage(body.error??"Link kon niet worden gemaakt.");return;}
    const absolute=`${window.location.origin}${body.path}`;
    setUrl(absolute);
    try{await navigator.clipboard.writeText(absolute);setMessage("Booking link gemaakt en gekopieerd.");}catch{setMessage("Booking link gemaakt.");}
  }

  async function share(){
    if(!url)return;
    if(navigator.share){try{await navigator.share({title:"Kies je afspraak",text:"Kies hier een beschikbaar tijdstip:",url});return}catch{}}
    try{await navigator.clipboard.writeText(url);setMessage("Link gekopieerd.");}catch{}
  }

  if(!services.length)return <p className="rounded-[20px] border border-dashed border-[var(--border-strong)] bg-white p-6 text-sm text-[var(--muted)]">Maak eerst een actieve online boekbare behandeling aan.</p>;

  return <div className="rounded-[24px] border border-[var(--border)] bg-white p-4 sm:p-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Behandeling</span><select value={serviceId} onChange={event=>{setServiceId(event.target.value);setStaffId("");}} className="h-11 rounded-[13px] border border-[var(--border)] bg-white px-3.5">{services.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Medewerker</span><select value={staffId} onChange={event=>setStaffId(event.target.value)} className="h-11 rounded-[13px] border border-[var(--border)] bg-white px-3.5"><option value="">Geen voorkeur — kies automatisch</option>{eligible.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Vanaf</span><input type="date" min={today} value={startDate} onChange={event=>{setStartDate(event.target.value);if(event.target.value>endDate)setEndDate(event.target.value)}} className="h-11 rounded-[13px] border border-[var(--border)] bg-white px-3.5"/></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Tot en met</span><input type="date" min={startDate} value={endDate} onChange={event=>setEndDate(event.target.value)} className="h-11 rounded-[13px] border border-[var(--border)] bg-white px-3.5"/></label>
    </div>
    <button type="button" onClick={create} disabled={busy||!serviceId} className="mt-5 min-h-11 rounded-[13px] bg-[var(--ink)] px-4 text-sm font-medium text-white disabled:opacity-40">{busy?"Link maken…":"Maak booking link"}</button>
    {message?<p role="status" className="mt-3 text-sm text-[var(--muted)]">{message}</p>:null}
    {url?<div className="mt-4 rounded-[16px] bg-[var(--surface-soft)] p-3"><input aria-label="Smart booking link" readOnly value={url} onFocus={event=>event.currentTarget.select()} className="w-full bg-transparent text-xs outline-none"/><div className="mt-3 flex gap-2"><button type="button" onClick={share} className="min-h-10 rounded-[12px] bg-white px-3 text-xs font-semibold ring-1 ring-[var(--border)]">Delen / WhatsApp</button></div></div>:null}
  </div>;
}
