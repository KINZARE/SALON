import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getCustomers } from "@/services/app-data";
import { searchCustomers } from "@/services/workspace-data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CustomersPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <p>Geen toegang.</p>;
  const params=await searchParams;
  const q=typeof params.q==="string"?params.q.trim():"";
  const customers=q.length>=2?await searchCustomers(salon.id,q):await getCustomers(salon.id);
  return <>
    <header><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Klanten</h1><p className="mt-1 text-sm text-[var(--muted)]">Vind een klant en boek opnieuw.</p></header>
    <form className="mt-6 flex max-w-xl gap-2"><input aria-label="Zoek klanten" name="q" defaultValue={q} placeholder="Zoek naam, telefoon of e-mail" className="h-11 min-w-0 flex-1 rounded-[10px] border border-[var(--border)] bg-white px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/><button className="h-11 rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]">Zoeken</button></form>
    {q.length===1?<p className="mt-3 text-sm text-[var(--muted)]" role="status">Gebruik minstens 2 tekens om te zoeken.</p>:null}
    <div className="mt-7">{!customers.length?<EmptyState title={q?"Geen resultaten":"Nog geen klanten"} description={q?"Probeer een andere zoekterm.":"Klanten worden automatisch aangemaakt wanneer een afspraak wordt geboekt."}/>:<div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{customers.map(customer=><Link href={`/app/customers/${customer.id}`} key={customer.id} className="block min-w-0 py-4 hover:bg-[var(--surface-soft)] sm:px-2"><p className="truncate font-semibold">{customer.name}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{[customer.phone,customer.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p></Link>)}</div>}</div>
  </>;
}
