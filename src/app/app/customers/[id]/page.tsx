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

const statusLabels: Record<string, string> = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  checked_in: "Aanwezig",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  no_show: "No-show",
};

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { salon, membership } = await requireAppContext();

  if (membership.role === "staff") {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Klantprofielen zijn alleen beschikbaar voor owner en manager.</p>
      </div>
    );
  }

  let customer;
  let appointments;

  if (isPreviewDemoMode()) {
    customer = getDemoCustomer(id);
    if (!customer) notFound();
    appointments = getDemoCustomerAppointments(id);
  } else {
    const db = await createUserSupabaseClient();
    const [customerResult, appointmentsResult] = await Promise.all([
      db
        .from("customers")
        .select("id,name,phone,email,internal_notes,created_at")
        .eq("salon_id", salon.id)
        .eq("id", id)
        .maybeSingle(),
      db
        .from("appointments")
        .select("id,starts_at,status,service_name_snapshot,price_cents_snapshot,currency_snapshot")
        .eq("salon_id", salon.id)
        .eq("customer_id", id)
        .order("starts_at", { ascending: false })
        .limit(100),
    ]);

    if (customerResult.error) throw customerResult.error;
    if (!customerResult.data) notFound();
    if (appointmentsResult.error) throw appointmentsResult.error;

    customer = customerResult.data;
    appointments = appointmentsResult.data ?? [];
  }

  const completed = appointments.filter((item) => item.status === "completed");
  const noShows = appointments.filter((item) => item.status === "no_show").length;
  const now = Date.now();
  const upcoming = [...appointments]
    .filter((item) => !["completed", "cancelled", "no_show"].includes(item.status) && new Date(item.starts_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

  return (
    <>
      <Link href="/app/customers" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]">
        ← Customers
      </Link>

      <header className="mt-4 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Customer</p>
        <h1 className="mt-2 break-words text-[clamp(2.2rem,6vw,4.2rem)] font-semibold leading-none tracking-[-0.06em]">{customer.name}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-[var(--muted)]">
          {[customer.phone, customer.email].filter(Boolean).join(" · ") || "Geen contactgegevens"}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-3 rounded-[var(--radius-card-sm)] bg-[var(--surface)] p-5">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{appointments.length}</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">afspraken</p>
        </div>
        <div className="border-l border-[var(--line)] pl-4">
          <p className="text-2xl font-semibold tabular-nums">{completed.length}</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">afgerond</p>
        </div>
        <div className="border-l border-[var(--line)] pl-4">
          <p className="text-2xl font-semibold tabular-nums">{noShows}</p>
          <p className="mt-1 text-[11px] text-[var(--muted)]">no-shows</p>
        </div>
      </div>

      {upcoming ? (
        <Link href={`/app/appointments/${upcoming.id}`} className="mt-6 block max-w-3xl rounded-[var(--radius-card-sm)] bg-[var(--ink)] p-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-light)]">Volgende afspraak</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-[-0.04em]">{upcoming.service_name_snapshot}</p>
              <p className="mt-1 text-sm text-white/55">
                {formatInTimeZone(new Date(upcoming.starts_at), salon.timezone, "d MMM yyyy · HH:mm")}
              </p>
            </div>
            <span className="text-sm">→</span>
          </div>
        </Link>
      ) : null}

      <section className="mt-10 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Interne notitie</p>
        <form action={updateCustomerNotes} className="mt-4">
          <input type="hidden" name="customerId" value={customer.id} />
          <textarea
            name="notes"
            defaultValue={customer.internal_notes ?? ""}
            maxLength={3000}
            rows={4}
            className="w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)]"
            placeholder="Alleen operationele notities. Geen medische dossiers."
          />
          <Button variant="secondary" className="mt-3">Notitie opslaan</Button>
        </form>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Historie</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Afspraken</h2>
          </div>
          <p className="text-xs text-[var(--muted)]">{appointments.length} totaal</p>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {appointments.map((item) => (
            <Link
              href={`/app/appointments/${item.id}`}
              key={item.id}
              className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-[-0.02em]">{item.service_name_snapshot}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatInTimeZone(new Date(item.starts_at), salon.timezone, "dd-MM-yyyy HH:mm")} · {statusLabels[item.status] ?? item.status.replaceAll("_", " ")}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatMoney(item.price_cents_snapshot, item.currency_snapshot)}</p>
            </Link>
          ))}
          {!appointments.length ? <p className="py-8 text-sm text-[var(--muted)]">Nog geen afspraken.</p> : null}
        </div>
      </section>
    </>
  );
}
