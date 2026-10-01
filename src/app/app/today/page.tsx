import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getAppointmentsForDate } from "@/services/app-data";
import { formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";

const statusLabels: Record<string, string> = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  checked_in: "Aanwezig",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  no_show: "No-show",
};

export default async function TodayPage() {
  const { salon, membership } = await requireAppContext();
  const appointments = await getAppointmentsForDate(salon.id, salon.timezone);
  const active = appointments.filter((item) => !["cancelled", "no_show"].includes(item.status));
  const planned = active.reduce((sum, item) => sum + item.price_cents_snapshot, 0);
  const completedCount = appointments.filter((item) => item.status === "completed").length;
  const now = Date.now();
  const next = active.find((item) => new Date(item.starts_at).getTime() > now);
  const dateLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: salon.timezone,
  }).format(new Date());

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Vandaag</p>
          <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Today</h1>
          <p className="mt-2 text-sm capitalize text-[var(--muted)]">{dateLabel}</p>
        </div>
        {membership.role !== "staff" ? (
          <Link
            href="/app/calendar/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--ink)] px-5 text-sm font-medium text-white transition-transform active:scale-[0.985]"
          >
            + Afspraak
          </Link>
        ) : null}
      </header>

      {next ? (
        <Link
          href={`/app/appointments/${next.id}`}
          className="salon-float mt-8 block rounded-[var(--radius-card)] bg-[var(--ink)] p-5 text-white sm:p-7"
        >
          <div className="grid gap-6 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-light)]">Volgende afspraak</p>
              <time className="mt-3 block text-5xl font-semibold leading-none tracking-[-0.06em] tabular-nums">
                {formatInTimeZone(new Date(next.starts_at), salon.timezone, "HH:mm")}
              </time>
            </div>
            <div className="min-w-0 sm:text-right">
              <p className="truncate text-xl font-semibold tracking-[-0.035em]">
                {next.customer?.name ?? next.customer_name_snapshot ?? "Klant"}
              </p>
              <p className="mt-1 truncate text-sm text-white/58">
                {next.service_name_snapshot}
                {next.staff?.name ? ` · ${next.staff.name}` : ""}
              </p>
              <span className="mt-5 inline-flex min-h-10 items-center rounded-[var(--radius-pill)] bg-white px-4 text-xs font-medium text-[var(--ink)]">
                Open afspraak →
              </span>
            </div>
          </div>
        </Link>
      ) : null}

      <section className="mt-5 grid grid-cols-3 rounded-[var(--radius-card-sm)] bg-[var(--surface)] px-4 py-5 sm:px-6" aria-label="Vandaag samengevat">
        <div className="pr-3">
          <p className="text-2xl font-semibold tracking-[-0.045em] tabular-nums">{active.length}</p>
          <p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">afspraken</p>
        </div>
        <div className="border-l border-[var(--line)] px-3 sm:px-5">
          {membership.role === "staff" ? (
            <>
              <p className="text-2xl font-semibold tracking-[-0.045em] tabular-nums">{completedCount}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">afgerond</p>
            </>
          ) : (
            <>
              <p className="truncate text-xl font-semibold tracking-[-0.04em] tabular-nums sm:text-2xl">
                {formatMoney(planned, salon.currency)}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">gepland</p>
            </>
          )}
        </div>
        <div className="border-l border-[var(--line)] pl-3 sm:pl-5">
          <p className="text-xl font-semibold tracking-[-0.035em] tabular-nums sm:text-2xl">
            {next ? formatInTimeZone(new Date(next.starts_at), salon.timezone, "HH:mm") : "—"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">volgende</p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Planning</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Je dag</h2>
          </div>
          <Link href="/app/calendar" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
            Calendar →
          </Link>
        </div>

        {!appointments.length ? (
          <div className="mt-5">
            <EmptyState
              title="Nog geen afspraken vandaag"
              description="Nieuwe afspraken verschijnen hier zodra klanten boeken of een bevoegde gebruiker een afspraak toevoegt."
              {...(membership.role !== "staff" ? { action: "+ Afspraak", href: "/app/calendar/new" } : {})}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[var(--radius-card-sm)] border border-[var(--line)] bg-white">
            {appointments.map((item, index) => {
              const quiet = ["cancelled", "no_show"].includes(item.status);
              return (
                <Link
                  href={`/app/appointments/${item.id}`}
                  key={item.id}
                  className={`grid min-h-[76px] grid-cols-[52px_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface)] sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:px-5 ${index ? "border-t border-[var(--line)]" : ""} ${quiet ? "opacity-55" : ""}`}
                >
                  <time className="text-sm font-semibold tabular-nums">
                    {formatInTimeZone(new Date(item.starts_at), salon.timezone, "HH:mm")}
                  </time>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-[-0.015em]">
                      {item.customer?.name ?? item.customer_name_snapshot ?? "Klant"}
                    </p>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {item.service_name_snapshot}
                      {item.staff?.name ? ` · ${item.staff.name}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)] sm:hidden">
                      {statusLabels[item.status] ?? item.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="hidden shrink-0 rounded-[var(--radius-pill)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted)] sm:inline-flex">
                    {statusLabels[item.status] ?? item.status.replaceAll("_", " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
