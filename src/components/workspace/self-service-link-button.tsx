"use client";

import { useState } from "react";

export function SelfServiceLinkButton({appointmentId}:{appointmentId:string}){
  const [state,setState]=useState<"idle"|"loading"|"ready"|"error">("idle");
  const [url,setUrl]=useState("");
  async function createLink(){
    setState("loading");
    const response=await fetch(`/api/internal/appointments/${appointmentId}/self-service-link`,{method:"POST"});
    const body=await response.json() as {path?:string;error?:string};
    if(!response.ok||!body.path){setState("error");return;}
    const absolute=`${window.location.origin}${body.path}`;
    setUrl(absolute);
    try{await navigator.clipboard.writeText(absolute);}catch{}
    setState("ready");
  }
  return <div className="inline-flex flex-col items-start gap-2">
    <button type="button" onClick={createLink} disabled={state==="loading"} className="inline-flex min-h-11 items-center rounded-[13px] border border-[var(--border)] bg-white px-4 text-sm font-medium disabled:opacity-50">{state==="loading"?"Link maken…":state==="ready"?"Klantlink gekopieerd":"Klantlink delen"}</button>
    {state==="ready"?<input aria-label="Klantlink" readOnly value={url} onFocus={event=>event.currentTarget.select()} className="w-full max-w-[360px] rounded-[11px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[11px] text-[var(--muted)]"/>:null}
    {state==="error"?<span className="text-xs text-[var(--danger)]">Klantlink kon niet worden gemaakt.</span>:null}
  </div>;
}
