import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { transitionAppointmentStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { getDemoAppointment } from "@/demo/preview-data";

const actions: Record<string, Array<{ label: string; status: string; variant?: "primary" | "secondary" | "danger" }>> = {
  pending: [{ label: "Bevestigen", status: "confirmed" }],
  confirmed: [
    { label: "Check-in", status: "checked_in" },
    { label: "No-show", status: "no_show", variant: "secondary" },
  ],
  checked_in: [{ label: "Afronden", status: "completed" }],
  completed: [],
  cancelled: [],
  no_show: [],
};

const statusLabels: Record<string, string> = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  checked_in: "Aanwezig",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  no_show: "No-show",
};

const paymentLabels: Record<string, string> = {
  unpaid: "Open",
  pending: "In behandeling",
  paid: "Betaald",
  refunded: "Terugbetaald",
  failed: "Mislukt",
};

export default async function AppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const errorMessage = typeof query.error === "string" ? query.error : null;
  const { salon, membership } = await requireAppContext();

  let appointment;
  let customer;
  let staff;

  if (isPreviewDemoMode()) {
    const localDate = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd");
    const demo = getDemoAppointment(id, localDate);
    if (!demo) notFound();
    appointment = demo;
    customer = demo.customer;
    staff = demo.staff;
  } else {
    const db = await createUserSupabaseClient();
    const result = await db
      .from("appointments")
      .select("id,customer_id,staff_id,service_id,customer_name_snapshot,starts_at,service_ends_at,status,payment_status,service_name_snapshot,duration_minutes_snapshot,price_cents_snapshot,currency_snapshot,note")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .maybeSingle();

    if (result.error) throw result.error;
    if (!result.data) notFound();

    appointment = result.data;

    const [customerResult, staffResult] = await Promise.all([
      db.from("customers").select("name,phone,email").eq("id", appointment.customer_id).maybeSingle(),
      db.from("staff").select("name").eq("id", appointment.staff_id).maybeSingle(),
    ]);

    customer = customerResult.data;
    staff = staffResult.data;
  }

  const canManage = ["owner", "manager"].includes(membership.role);
  const active = !["completed", "cancelled", "no_show"].includes(appointment.status);

  return (
    <>
      <Link
        href="/app/calendar"
        className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Calendar
      </Link>

      <header className="mt-4 max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Afspraak</p>
            <time className="mt-2 block text-[clamp(3.2rem,8vw,5.8rem)] font-semibold leading-none tracking-[-0.07em] tabular-nums">
              {formatInTimeZone(new Date(appointment.starts_at), salon.timezone, "HH:mm")}
            </time>
          </div>
          <span className="rounded-[var(--radius-pill)] bg-[var(--surface)] px-3.5 py-2 text-xs font-medium text-[var(--muted)]">
            {statusLabels[appointment.status] ?? appointment.status.replaceAll("_", " ")}
          </span>
        </div>

        <h1 className="mt-5 break-words text-3xl font-semibold tracking-[-0.045em]">
          {customer?.name ?? appointment.customer_name_snapshot ?? "Afspraak"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {appointment.service_name_snapshot} · {staff?.name ?? "Medewerker"}
        </p>
      </header>

      {errorMessage ? (
        <div role="alert" className="mt-6 max-w-3xl rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 max-w-3xl overflow-hidden rounded-[var(--radius-card-sm)] border border-[var(--line)]">
        <div className="grid grid-cols-2 gap-5 bg-[var(--surface)] p-5 sm:grid-cols-4 sm:p-6">
          <div>
            <p className="text-[11px] text-[var(--muted)]">Datum</p>
            <p className="mt-1 text-sm font-semibold">
              {formatInTimeZone(new Date(appointment.starts_at), salon.timezone, "d MMM yyyy")}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--muted)]">Tijd</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatInTimeZone(new Date(appointment.starts_at), salon.timezone, "HH:mm")}–
              {formatInTimeZone(new Date(appointment.service_ends_at), salon.timezone, "HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--muted)]">Prijs</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatMoney(appointment.price_cents_snapshot, appointment.currency_snapshot)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--muted)]">Betaling</p>
            <p className="mt-1 text-sm font-semibold">
              {paymentLabels[appointment.payment_status] ?? appointment.payment_status.replaceAll("_", " ")}
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--line)] bg-white p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Klant</p>
          <p className="mt-2 break-words font-semibold">
            {customer?.name ?? appointment.customer_name_snapshot ?? "—"}
          </p>
          <p className="mt-1 break-words text-sm leading-6 text-[var(--muted)]">
            {[customer?.phone, customer?.email].filter(Boolean).join(" · ") || "Geen contactgegevens"}
          </p>
        </div>

        {appointment.note ? (
          <div className="border-t border-[var(--line)] bg-white p-5 sm:p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">Notitie</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{appointment.note}</p>
          </div>
        ) : null}
      </div>

      {canManage && active ? (
        <section className="mt-8 max-w-3xl border-t border-[var(--line)] pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Acties</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/appointments/${appointment.id}/reschedule`}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--line)] bg-white px-5 text-sm font-medium"
            >
              Verplaatsen
            </Link>

            {(actions[appointment.status] ?? []).map((action) => (
              <form key={action.status} action={transitionAppointmentStatus}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="status" value={action.status} />
                <Button variant={action.variant ?? "primary"}>{action.label}</Button>
              </form>
            ))}

            <Link
              href={`/app/appointments/${appointment.id}/cancel`}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[#e7c3bd] bg-white px-5 text-sm font-medium text-[var(--danger)] hover:bg-[#fff7f5]"
            >
              Annuleren
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
