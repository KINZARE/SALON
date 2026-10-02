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

  return <div data-search-workspace>
    <header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Search</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Vind wat je nodig hebt</h1><p className="mt-1 text-sm text-[var(--muted)]">{q?`${count} resultaten voor “${q}”`:"Zoek klanten, afspraken, medewerkers en services vanuit één plek."}</p></header>
    {q&&count===0?<div className="mt-7 rounded-[22px] border border-dashed border-[var(--border-strong)] bg-white p-8 text-center"><p className="font-semibold">Geen relevante matches</p><p className="mt-1 text-sm text-[var(--muted)]">Probeer naam, telefoon, service of medewerker.</p></div>:null}
    <div className="mt-7 grid gap-4 lg:grid-cols-2">
      {results.customers.length?<ResultSection title="Customers">{results.customers.map(item=><Link key={item.id} href={`/app/customers/${item.id}`} className="block px-4 py-3.5 hover:bg-[var(--surface-soft)]"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{[item.phone,item.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p></Link>)}</ResultSection>:null}
      {results.appointments.length?<ResultSection title="Appointments">{results.appointments.map(item=><Link key={item.id} href={`/app/appointments/${item.id}`} className="block px-4 py-3.5 hover:bg-[var(--surface-soft)]"><p className="font-semibold">{item.customer_name_snapshot}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.service_name_snapshot} · {formatInTimeZone(new Date(item.starts_at),salon.timezone,"dd-MM HH:mm")}</p></Link>)}</ResultSection>:null}
      {results.staff.length?<ResultSection title="Team">{results.staff.map(item=><Link key={item.id} href="/app/staff" className="block px-4 py-3.5 font-semibold hover:bg-[var(--surface-soft)]">{item.name}{!item.active?<span className="ml-2 text-xs font-normal text-[var(--muted)]">inactief</span>:null}</Link>)}</ResultSection>:null}
      {results.services.length?<ResultSection title="Services">{results.services.map(item=><Link key={item.id} href="/app/services" className="block px-4 py-3.5 font-semibold hover:bg-[var(--surface-soft)]">{item.name}{!item.active?<span className="ml-2 text-xs font-normal text-[var(--muted)]">inactief</span>:null}</Link>)}</ResultSection>:null}
    </div>
  </div>;
}

function ResultSection({title,children}:{title:string;children:React.ReactNode}){
  return <section><h2 className="mb-2 text-xs font-semibold uppercase tracking-[.1em] text-[var(--muted)]">{title}</h2><div className="divide-y divide-[var(--border)] overflow-hidden rounded-[20px] border border-[var(--border)] bg-white">{children}</div></section>;
}
