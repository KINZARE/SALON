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
  return <form onSubmit={event=>{event.preventDefault();const q=value.trim();if(q.length>=2)router.push(`/app/search?q=${encodeURIComponent(q)}`)}} className="w-full max-w-[280px]">
    <label className="sr-only" htmlFor="operational-search">Zoeken</label>
    <input ref={ref} id="operational-search" value={value} onChange={event=>setValue(event.target.value)} placeholder="Zoeken  /" className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]"/>
  </form>;
}
