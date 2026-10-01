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
      <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8491a4]">⌕</span>
      <input ref={ref} id="operational-search" value={value} onChange={event=>setValue(event.target.value)} placeholder="Zoek klanten, afspraken of behandelingen…" className="h-10 w-full rounded-xl border border-[var(--border)] bg-[#fafbfd] pl-9 pr-12 text-sm outline-none transition focus:border-[#b7cbf5] focus:bg-white focus:ring-2 focus:ring-[#2563eb]/10"/>
      <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[#e1e6ee] bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#8b96a7]">/</span>
    </div>
  </form>;
}
