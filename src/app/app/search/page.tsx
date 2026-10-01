import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { searchWorkspace } from "@/services/workspace-data";

export default async function SearchPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  const params=await searchParams;
  const q=typeof params.q==="string"?params.q.trim():"";
  if(membership.role==="staff")return <div><h1 className="text-3xl font-semibold">Search</h1><p className="mt-2 text-sm text-[var(--muted)]">Brede operationele search is beschikbaar voor owner en manager.</p></div>;
  const results=q.length>=2?await searchWorkspace(salon.id,q):{customers:[],staff:[],services:[],appointments:[]};
  const count=results.customers.length+results.staff.length+results.services.length+results.appointments.length;
  return <>
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Search</h1><p className="mt-1 text-sm text-[var(--muted)]">{q?`${count} resultaten voor “${q}”`:"Gebruik de zoekbalk bovenaan of druk /."}</p></header>
    {q&&count===0?<p className="mt-8 text-sm text-[var(--muted)]">Geen relevante matches.</p>:null}
    <div className="mt-7 grid gap-8 lg:grid-cols-2">
      {results.customers.length?<section><h2 className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--muted)]">Customers</h2><div className="mt-2 divide-y divide-[var(--border)] border-y border-[var(--border)]">{results.customers.map(item=><Link key={item.id} href={`/app/customers/${item.id}`} className="block py-3"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{[item.phone,item.email].filter(Boolean).join(" · ")}</p></Link>)}</div></section>:null}
      {results.appointments.length?<section><h2 className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--muted)]">Appointments</h2><div className="mt-2 divide-y divide-[var(--border)] border-y border-[var(--border)]">{results.appointments.map(item=><Link key={item.id} href={`/app/appointments/${item.id}`} className="block py-3"><p className="font-semibold">{item.customer_name_snapshot}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.service_name_snapshot} · {formatInTimeZone(new Date(item.starts_at),salon.timezone,"dd-MM HH:mm")}</p></Link>)}</div></section>:null}
      {results.staff.length?<section><h2 className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--muted)]">Team</h2><div className="mt-2 divide-y divide-[var(--border)] border-y border-[var(--border)]">{results.staff.map(item=><Link key={item.id} href="/app/staff" className="block py-3 font-semibold">{item.name}{!item.active?<span className="ml-2 text-xs font-normal text-[var(--muted)]">inactief</span>:null}</Link>)}</div></section>:null}
      {results.services.length?<section><h2 className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--muted)]">Services</h2><div className="mt-2 divide-y divide-[var(--border)] border-y border-[var(--border)]">{results.services.map(item=><Link key={item.id} href="/app/services" className="block py-3 font-semibold">{item.name}{!item.active?<span className="ml-2 text-xs font-normal text-[var(--muted)]">inactief</span>:null}</Link>)}</div></section>:null}
    </div>
  </>;
}
