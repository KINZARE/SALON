import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { saveCustomer } from "./actions";
import { getCustomerIntakeSummary } from "@/services/product-completion";

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

  const now=Date.now();
  const upcoming=appointments.filter(item=>["pending","confirmed","checked_in"].includes(item.status)&&new Date(item.starts_at).getTime()>=now).toSorted((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime());
  const previous=appointments.filter(item=>new Date(item.starts_at).getTime()<now).toSorted((a,b)=>new Date(b.starts_at).getTime()-new Date(a.starts_at).getTime());
  const nextAppointment=upcoming[0]??null;
  const lastVisit=previous.find(item=>item.status==="completed")??previous[0]??null;
  const completed=appointments.filter(item=>item.status==="completed");
  const noShows=appointments.filter(item=>item.status==="no_show").length;
  const cancellations=appointments.filter(item=>item.status==="cancelled").length;
  const error=typeof query.error==="string"?query.error:null;
  const intake=await getCustomerIntakeSummary(salon.id,customer.id);

  return <div data-customer-profile data-customer-action-centre>
    <Link href="/app/customers" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">← Customers</Link>

    <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Klant</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">{customer.name}</h1><p className="mt-1 text-sm text-[var(--muted)]">{[customer.phone,customer.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p></div>
      <div className="flex flex-wrap gap-2">
        {customer.phone?<a href={`tel:${customer.phone}`} className="inline-flex h-11 items-center rounded-[13px] border border-[var(--border)] bg-white px-4 text-sm font-medium">Bellen</a>:null}
        <Link href={`/app/calendar/new?customerId=${customer.id}`} className="inline-flex h-11 items-center rounded-[13px] bg-[var(--ink)] px-4 text-sm font-medium text-white">+ Nieuwe afspraak</Link>
      </div>
    </header>

    {error?<p role="alert" className="mt-5 rounded-[14px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-[18px] border border-[var(--border)] bg-white p-4"><p className="text-2xl font-semibold">{appointments.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afspraken</p></div>
      <div className="rounded-[18px] border border-[var(--border)] bg-white p-4"><p className="text-2xl font-semibold">{completed.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afgerond</p></div>
      <div className="rounded-[18px] border border-[var(--border)] bg-white p-4"><p className="text-2xl font-semibold">{cancellations}</p><p className="mt-1 text-xs text-[var(--muted)]">annuleringen</p></div>
      <div className="rounded-[18px] border border-[var(--border)] bg-white p-4"><p className="text-2xl font-semibold">{noShows}</p><p className="mt-1 text-xs text-[var(--muted)]">no-shows</p></div>
    </div>

    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <section className="rounded-[24px] bg-[var(--ink)] p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent-light)]">Komende afspraak</p>
        {nextAppointment?<Link href={`/app/appointments/${nextAppointment.id}`} className="mt-4 block"><p className="text-3xl font-semibold tracking-[-.05em] tabular-nums">{formatInTimeZone(new Date(nextAppointment.starts_at),salon.timezone,"dd MMM · HH:mm")}</p><p className="mt-2 text-sm text-white/60">{nextAppointment.service_name_snapshot}</p><div className="mt-4"><StatusChip status={nextAppointment.status}/></div></Link>:<div className="mt-4"><p className="font-semibold">Nog niets gepland.</p><p className="mt-1 text-sm text-white/55">Maak direct een nieuwe afspraak voor deze klant.</p></div>}
      </section>

      <section className="rounded-[24px] border border-[var(--border)] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Laatste bezoek</p>
        {lastVisit?<Link href={`/app/appointments/${lastVisit.id}`} className="mt-4 block"><p className="text-xl font-semibold">{lastVisit.service_name_snapshot}</p><p className="mt-1 text-sm text-[var(--muted)]">{formatInTimeZone(new Date(lastVisit.starts_at),salon.timezone,"dd MMM yyyy · HH:mm")}</p><div className="mt-3"><StatusChip status={lastVisit.status}/></div></Link>:<p className="mt-4 text-sm text-[var(--muted)]">Nog geen eerdere bezoeken.</p>}
      </section>
    </div>

    <section className="mt-9 max-w-2xl rounded-[24px] border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold">Klantgegevens & interne notitie</h2>
      <form action={saveCustomer} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="customerId" value={customer.id}/>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Naam</span><input name="name" defaultValue={customer.name} required maxLength={160} className="h-11 rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3.5 outline-none focus:border-[var(--accent-light)]"/></label>
        <label className="grid gap-1.5 text-sm font-medium"><span>Telefoon</span><input name="phone" defaultValue={customer.phone??""} className="h-11 rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3.5 outline-none focus:border-[var(--accent-light)]"/></label>
        <label className="grid gap-1.5 text-sm font-medium"><span>E-mail</span><input name="email" type="email" defaultValue={customer.email??""} className="h-11 rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3.5 outline-none focus:border-[var(--accent-light)]"/></label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2"><span>Interne notitie</span><textarea name="notes" defaultValue={customer.internal_notes??""} maxLength={3000} rows={4} className="rounded-[13px] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 outline-none focus:border-[var(--accent-light)]"/></label>
        <div className="sm:col-span-2"><Button variant="secondary">Klant opslaan</Button></div>
      </form>
    </section>

    <section className="mt-9 rounded-[24px] border border-[var(--border)] bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Intake & toestemming</p><h2 className="mt-1 text-lg font-semibold">Dossierstatus</h2></div><span className="text-xs text-[var(--muted)]">{intake.submissions.length} formulieren</span></div><div className="mt-4 grid gap-2">{intake.submissions.map(item=><Link key={item.id} href={`/app/intake/submissions/${item.id}`} className="flex items-center justify-between gap-3 rounded-[13px] bg-[var(--background)] px-3 py-3 text-sm"><span>Formulier v{item.form_version}</span><span className="text-xs text-[var(--muted)]">{formatInTimeZone(new Date(item.submitted_at),salon.timezone,"dd MMM yyyy · HH:mm")}</span></Link>)}{!intake.submissions.length?<p className="text-sm text-[var(--muted)]">Nog geen intake ontvangen.</p>:null}</div>{intake.consents.length?<p className="mt-4 text-xs text-[var(--muted)]">{intake.consents.length} toestemming{intake.consents.length===1?"":"en"} geregistreerd.</p>:null}</section>

    <section className="mt-9">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Afspraakgeschiedenis</h2><span className="text-xs text-[var(--muted)]">{appointments.length} totaal</span></div>
      <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">{appointments.map((item,index)=><Link href={`/app/appointments/${item.id}`} key={item.id} className={`flex items-center justify-between gap-4 px-4 py-4 sm:px-5 ${index?"border-t border-[var(--border)]":""}`}><div className="min-w-0"><p className="truncate font-semibold">{item.service_name_snapshot}</p><p className="mt-1 text-sm text-[var(--muted)]">{formatInTimeZone(new Date(item.starts_at),salon.timezone,"dd-MM-yyyy HH:mm")}</p><div className="mt-2"><StatusChip status={item.status}/></div></div><p className="shrink-0 text-sm font-semibold">{formatMoney(item.price_cents_snapshot,item.currency_snapshot)}</p></Link>)}{!appointments.length?<p className="px-5 py-8 text-sm text-[var(--muted)]">Nog geen afspraken.</p>:null}</div>
    </section>
  </div>;
}
