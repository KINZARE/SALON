"use client";
import { useState } from "react";

export function IntakeLinkButton({appointmentId,forms}:{appointmentId:string;forms:Array<{id:string;title:string}>}){
  const [formId,setFormId]=useState(forms[0]?.id??"");
  const [state,setState]=useState<"idle"|"loading"|"ready"|"error">("idle");
  const [url,setUrl]=useState("");
  if(!forms.length)return null;
  async function createLink(){
    setState("loading");
    const response=await fetch(`/api/internal/appointments/${appointmentId}/intake-link`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({formId})});
    const body=await response.json() as {path?:string;qrPayload?:string};
    if(!response.ok||!body.path){setState("error");return}
    const absolute=`${window.location.origin}${body.path}`;setUrl(absolute);
    try{await navigator.clipboard.writeText(absolute)}catch{}
    setState("ready");
  }
  return <div className="inline-flex flex-col gap-2">
    {forms.length>1?<select aria-label="Intakeformulier" value={formId} onChange={e=>setFormId(e.target.value)} className="h-10 rounded-[11px] border border-[var(--border)] bg-white px-3 text-xs">{forms.map(form=><option key={form.id} value={form.id}>{form.title}</option>)}</select>:null}
    <button type="button" onClick={createLink} disabled={state==="loading"} className="inline-flex min-h-11 items-center rounded-[13px] border border-[var(--border)] bg-white px-4 text-sm font-medium disabled:opacity-50">{state==="loading"?"Link maken…":state==="ready"?"Intakelink gekopieerd":"Intakelink delen"}</button>
    {state==="ready"?<div className="grid gap-1"><input aria-label="Intakelink en QR-bestemming" data-qr-payload={url} readOnly value={url} onFocus={e=>e.currentTarget.select()} className="w-full max-w-[360px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[11px] text-[var(--muted)]"/><span className="text-[11px] text-[var(--muted)]">Dezelfde veilige URL kan als QR-code bestemming worden gebruikt.</span></div>:null}
    {state==="error"?<span className="text-xs text-[var(--danger)]">Intakelink kon niet worden gemaakt.</span>:null}
  </div>;
}
