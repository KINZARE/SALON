"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function WaitlistJoinForm({
  salonSlug,
  serviceId,
  staffId,
  date,
}:{
  salonSlug:string;
  serviceId:string;
  staffId:string|null;
  date:string;
}){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [saved,setSaved]=useState(false);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try{
      const response=await fetch(`/api/public/${encodeURIComponent(salonSlug)}/waitlist`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          serviceId,
          staffId,
          date,
          customer:{
            name:form.get("name"),
            phone:form.get("phone"),
            email:form.get("email"),
          },
        }),
      });
      const payload=await response.json() as {error?:string};
      if(!response.ok)throw new Error(payload.error||"Aanmelden is niet gelukt.");
      setSaved(true);
    }catch(error){
      setError(error instanceof Error?error.message:"Aanmelden is niet gelukt.");
    }finally{
      setBusy(false);
    }
  }

  if(saved)return <div data-waitlist-saved className="rounded-[16px] border border-[#cbdccd] bg-[#eef5ef] p-4 text-sm text-[#42654e]"><p className="font-semibold">Je staat op de wachtlijst.</p><p className="mt-1 text-xs leading-5">De salon kan contact opnemen als er op deze dag een passende plek vrijkomt.</p></div>;

  if(!open)return <div className="mt-4"><button type="button" onClick={()=>setOpen(true)} className="text-sm font-semibold text-[var(--accent-dark)] underline decoration-[#d8b69e] underline-offset-4">Zet mij op de wachtlijst</button></div>;

  return <form onSubmit={submit} className="mt-4 grid gap-3 rounded-[18px] border border-[var(--border)] bg-white p-4 text-left">
    <div><p className="text-sm font-semibold">Laat je gegevens achter</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Alleen voor deze gekozen dag. Er wordt niets automatisch geboekt.</p></div>
    <Field label="Naam" name="name" required maxLength={160}/>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Telefoon" name="phone" type="tel" maxLength={40}/>
      <Field label="E-mail" name="email" type="email" maxLength={254}/>
    </div>
    <p className="text-[11px] leading-5 text-[var(--muted)]">Vul minimaal telefoon of e-mail in.</p>
    {error?<p role="alert" className="text-sm text-[var(--danger)]">{error}</p>:null}
    <div className="flex flex-wrap gap-2"><Button disabled={busy}>{busy?"Aanmelden…":"Aanmelden"}</Button><button type="button" onClick={()=>setOpen(false)} className="min-h-11 px-3 text-sm text-[var(--muted)]">Annuleren</button></div>
  </form>;
}
