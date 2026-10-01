import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getAppointmentsForDate } from "@/services/app-data";
import { formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TodayPage() {
  const { salon, membership } = await requireAppContext();
  const appointments = await getAppointmentsForDate(salon.id, salon.timezone);
  const active = appointments.filter((item) => !["cancelled", "no_show"].includes(item.status));
  const planned = active.reduce((sum, item) => sum + item.price_cents_snapshot, 0);
  const completedCount = appointments.filter((item) => item.status === "completed").length;
  const now = Date.now();
  const next = active.find((item) => new Date(item.starts_at).getTime() > now);
  return <>
    <header className="flex items-start justify-between gap-4">
      <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Today</h1><p className="mt-1 text-sm text-[var(--muted)]">{new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: salon.timezone }).format(new Date())}</p></div>
      {membership.role !== "staff" ? <Link href="/app/calendar/new" className="rounded-[11px] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white">+ Afspraak</Link> : null}
    </header>
    <div className="mt-7 grid grid-cols-3 gap-3 border-y border-[var(--border)] py-5">
      <div><p className="text-2xl font-semibold tracking-[-0.035em]">{active.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afspraken</p></div>
      {membership.role === "staff" ? <div><p className="text-2xl font-semibold tracking-[-0.035em]">{completedCount}</p><p className="mt-1 text-xs text-[var(--muted)]">afgerond</p></div> : <div><p className="text-2xl font-semibold tracking-[-0.035em]">{formatMoney(planned, salon.currency)}</p><p className="mt-1 text-xs text-[var(--muted)]">gepland</p></div>}
      <div><p className="text-lg font-semibold tracking-[-0.02em]">{next ? formatInTimeZone(new Date(next.starts_at), salon.timezone, "HH:mm") : "—"}</p><p className="mt-1 text-xs text-[var(--muted)]">volgende</p></div>
    </div>
    <section className="mt-7">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Planning</h2>
      {!appointments.length ? <div className="mt-3"><EmptyState title="Nog geen afspraken vandaag" description="Nieuwe afspraken verschijnen hier zodra klanten boeken of een bevoegde gebruiker een afspraak toevoegt." {...(membership.role !== "staff" ? { action: "+ Afspraak", href: "/app/calendar/new" } : {})} /></div> : <div className="mt-3 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {appointments.map((item) => <Link href={`/app/appointments/${item.id}`} key={item.id} className="flex items-start gap-4 py-4">
          <time className="w-12 shrink-0 text-sm font-semibold">{formatInTimeZone(new Date(item.starts_at), salon.timezone, "HH:mm")}</time>
          <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold">{item.customer?.name ?? item.customer_name_snapshot ?? "Klant"}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{item.service_name_snapshot}{item.staff?.name ? ` · ${item.staff.name}` : ""}</p></div>
          <span className="shrink-0 text-xs capitalize text-[var(--muted)]">{item.status.replace("_", " ")}</span>
        </Link>)}
      </div>}
    </section>
  </>;
}
