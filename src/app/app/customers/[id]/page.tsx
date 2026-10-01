import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { updateCustomerNotes } from "./actions";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { getDemoCustomer, getDemoCustomerAppointments } from "@/demo/preview-data";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Klantprofielen zijn alleen beschikbaar voor owner en manager.</p></div>;
  let customer;
  let appointments;
  if (isPreviewDemoMode()) {
    customer = getDemoCustomer(id);
    if (!customer) notFound();
    appointments = getDemoCustomerAppointments(id);
  } else {
    const db = await createUserSupabaseClient();
    const [customerResult, appointmentsResult] = await Promise.all([
      db.from("customers").select("id,name,phone,email,internal_notes,created_at").eq("salon_id", salon.id).eq("id", id).maybeSingle(),
      db.from("appointments").select("id,starts_at,status,service_name_snapshot,price_cents_snapshot,currency_snapshot").eq("salon_id", salon.id).eq("customer_id", id).order("starts_at", { ascending: false }).limit(100),
    ]);
    if (customerResult.error) throw customerResult.error;
    if (!customerResult.data) notFound();
    if (appointmentsResult.error) throw appointmentsResult.error;
    customer = customerResult.data;
    appointments = appointmentsResult.data ?? [];
  }
  const completed = appointments.filter((item) => item.status === "completed");
  const noShows = appointments.filter((item) => item.status === "no_show").length;

  return <>
    <Link href="/app/customers" className="text-sm text-[var(--muted)]">← Customers</Link>
    <header className="mt-5"><h1 className="text-3xl font-semibold tracking-[-0.04em]">{customer.name}</h1><p className="mt-1 text-sm text-[var(--muted)]">{[customer.phone, customer.email].filter(Boolean).join(" · ") || "Geen contactgegevens"}</p></header>
    <div className="mt-7 grid grid-cols-3 gap-3 border-y border-[var(--border)] py-5"><div><p className="text-2xl font-semibold">{appointments.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afspraken</p></div><div><p className="text-2xl font-semibold">{completed.length}</p><p className="mt-1 text-xs text-[var(--muted)]">completed</p></div><div><p className="text-2xl font-semibold">{noShows}</p><p className="mt-1 text-xs text-[var(--muted)]">no-shows</p></div></div>
    <section className="mt-8 max-w-2xl"><h2 className="text-lg font-semibold">Interne notitie</h2><form action={updateCustomerNotes} className="mt-3"><input type="hidden" name="customerId" value={customer.id}/><textarea name="notes" defaultValue={customer.internal_notes ?? ""} maxLength={3000} rows={4} className="w-full rounded-[11px] border border-[var(--border)] bg-white px-3.5 py-3 text-sm outline-none focus:border-[var(--primary)]" placeholder="Alleen operationele notities. Geen medische dossiers."/><Button variant="secondary" className="mt-3">Notitie opslaan</Button></form></section>
    <section className="mt-9"><h2 className="text-lg font-semibold">Afspraakgeschiedenis</h2><div className="mt-3 divide-y divide-[var(--border)] border-y border-[var(--border)]">{appointments.map((item)=><Link href={`/app/appointments/${item.id}`} key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{item.service_name_snapshot}</p><p className="mt-1 text-sm text-[var(--muted)]">{formatInTimeZone(new Date(item.starts_at), salon.timezone, "dd-MM-yyyy HH:mm")} · <span className="capitalize">{item.status.replace("_", " ")}</span></p></div><p className="shrink-0 text-sm font-semibold">{formatMoney(item.price_cents_snapshot, item.currency_snapshot)}</p></Link>)}{!appointments.length?<p className="py-8 text-sm text-[var(--muted)]">Nog geen afspraken.</p>:null}</div></section>
  </>;
}
