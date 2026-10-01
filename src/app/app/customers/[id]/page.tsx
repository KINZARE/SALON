import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { saveCustomer } from "./actions";

type HistoryRow={id:string;starts_at:string;status:string;service_name_snapshot:string;price_cents_snapshot:number;currency_snapshot:string};

export default async function CustomerPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {id}=await params;
  const query=await searchParams;
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Klantprofielen zijn alleen beschikbaar voor owner en manager.</p></div>;

  const db=createAdminSupabaseClient();
  const [customerResult,appointmentsResult]=await Promise.all([
    db.from("customers").select("id,name,phone,email,internal_notes,created_at").eq("salon_id",salon.id).eq("id",id).maybeSingle(),
    db.from("appointments").select("id,starts_at,status,service_name_snapshot,price_cents_snapshot,currency_snapshot").eq("salon_id",salon.id).eq("customer_id",id).order("starts_at",{ascending:false}).limit(100),
  ]);
  if(customerResult.error)throw customerResult.error;
  if(appointmentsResult.error)throw appointmentsResult.error;
  const customer=customerResult.data;
  const appointments=(appointmentsResult.data??[]) as HistoryRow[];
  if(!customer)notFound();
  const completed=appointments.filter(item=>item.status==="completed");
  const noShows=appointments.filter(item=>item.status==="no_show").length;
  const error=typeof query.error==="string"?query.error:null;

  return <>
    <Link href="/app/customers" className="text-sm text-[var(--muted)]">← Customers</Link>
    <header className="mt-5"><h1 className="text-3xl font-semibold tracking-[-0.04em]">{customer.name}</h1><p className="mt-1 text-sm text-[var(--muted)]">{[customer.phone,customer.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p></header>
    {error?<p role="alert" className="mt-5 text-sm text-[var(--danger)]">{error}</p>:null}
    <div className="mt-7 grid grid-cols-3 gap-3 border-y border-[var(--border)] py-5"><div><p className="text-2xl font-semibold">{appointments.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afspraken</p></div><div><p className="text-2xl font-semibold">{completed.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afgerond</p></div><div><p className="text-2xl font-semibold">{noShows}</p><p className="mt-1 text-xs text-[var(--muted)]">no-shows</p></div></div>
    <section className="mt-8 max-w-2xl"><h2 className="text-lg font-semibold">Klantgegevens</h2><form action={saveCustomer} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="customerId" value={customer.id}/>
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Naam</span><input name="name" defaultValue={customer.name} required maxLength={160} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5"/></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Telefoon</span><input name="phone" defaultValue={customer.phone??""} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5"/></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>E-mail</span><input name="email" type="email" defaultValue={customer.email??""} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5"/></label>
      <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Interne notitie</span><textarea name="notes" defaultValue={customer.internal_notes??""} maxLength={3000} rows={4} className="rounded-[11px] border border-[var(--border)] bg-white px-3.5 py-3"/></label>
      <div className="sm:col-span-2"><Button variant="secondary">Klant opslaan</Button></div>
    </form></section>
    <section className="mt-9"><h2 className="text-lg font-semibold">Afspraakgeschiedenis</h2><div className="mt-3 divide-y divide-[var(--border)] border-y border-[var(--border)]">{appointments.map(item=><Link href={`/app/appointments/${item.id}`} key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{item.service_name_snapshot}</p><p className="mt-1 text-sm text-[var(--muted)]">{formatInTimeZone(new Date(item.starts_at),salon.timezone,"dd-MM-yyyy HH:mm")} · <span className="capitalize">{item.status.replace("_"," ")}</span></p></div><p className="shrink-0 text-sm font-semibold">{formatMoney(item.price_cents_snapshot,item.currency_snapshot)}</p></Link>)}{!appointments.length?<p className="py-8 text-sm text-[var(--muted)]">Nog geen afspraken.</p>:null}</div></section>
  </>;
}
