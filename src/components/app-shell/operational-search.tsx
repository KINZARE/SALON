"use client";

import { useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";

export function OperationalSearch(){
  const router=useRouter();
  const ref=useRef<HTMLInputElement>(null);
  const [value,setValue]=useState("");

  useEffect(()=>{
    const handler=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if(event.key!=="/"||event.metaKey||event.ctrlKey||target?.matches("input,textarea,select,[contenteditable=true]"))return;
      event.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  return <form onSubmit={event=>{event.preventDefault();const q=value.trim();if(q.length>=2)router.push(`/app/search?q=${encodeURIComponent(q)}`)}} className="w-full max-w-[430px]">
    <label className="sr-only" htmlFor="operational-search">Zoeken</label>
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">⌕</span>
      <input ref={ref} id="operational-search" value={value} onChange={event=>setValue(event.target.value)} placeholder="Zoek klanten, afspraken of behandelingen…" className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] pl-9 pr-12 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)]"/>
      <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[6px] border border-[var(--border)] bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[var(--muted)]">/</span>
    </div>
  </form>;
}
