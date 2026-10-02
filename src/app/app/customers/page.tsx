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
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Customers</h1><p className="mt-1 text-sm text-[var(--muted)]">Tenant-safe klantzoeking en historie.</p></header>
    <form className="mt-6 flex max-w-xl gap-2"><input name="q" defaultValue={q} placeholder="Zoek naam, telefoon of e-mail" className="h-11 min-w-0 flex-1 rounded-[11px] border border-[var(--border)] bg-white px-3.5"/><button className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-4 text-sm font-medium">Zoeken</button></form>
    <div className="mt-7">{!customers.length?<EmptyState title={q?"Geen resultaten":"Nog geen klanten"} description={q?"Probeer een andere zoekterm.":"Klanten worden automatisch aangemaakt wanneer een afspraak wordt geboekt."}/>:<div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{customers.map(customer=><Link href={`/app/customers/${customer.id}`} key={customer.id} className="block py-4"><p className="font-semibold">{customer.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{[customer.phone,customer.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p></Link>)}</div>}</div>
  </>;
}
