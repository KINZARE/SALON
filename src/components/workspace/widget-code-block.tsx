"use client";

import { useState } from "react";

export function WidgetCodeBlock({title,value}:{title:string;value:string}){
  const [copied,setCopied]=useState(false);
  async function copy(){
    try{
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1600);
    }catch{
      setCopied(false);
    }
  }
  return <section className="rounded-[16px] border border-[var(--border)] bg-white p-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <button type="button" onClick={copy} className="h-9 rounded-[10px] border border-[var(--border)] bg-white px-3 text-xs font-semibold hover:bg-[var(--surface-soft)]">{copied?"Gekopieerd":"Kopiëren"}</button>
    </div>
    <textarea readOnly value={value} rows={6} onFocus={event=>event.currentTarget.select()} className="mt-3 w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] p-3 font-mono text-[11px] leading-5 text-[var(--muted)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/>
  </section>;
}
