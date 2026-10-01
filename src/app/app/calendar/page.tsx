import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getAppointmentsForDate } from "@/services/app-data";
import { EmptyState } from "@/components/ui/empty-state";

const statusLabels: Record<string, string> = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  checked_in: "Aanwezig",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  no_show: "No-show",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { salon, membership } = await requireAppContext();
  const params = await searchParams;
  const today = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd");
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const appointments = await getAppointmentsForDate(salon.id, salon.timezone, date);
  const base = new Date(`${date}T12:00:00Z`);
  const days = Array.from({ length: 7 }, (_, index) => {
    const value = new Date(base.getTime() + (index - 3) * 86_400_000);
    return value.toISOString().slice(0, 10);
  });
  const selectedLabel = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(base);

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Planning</p>
          <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Calendar</h1>
          <p className="mt-2 text-sm capitalize text-[var(--muted)]">{selectedLabel}</p>
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

      <div className="-mx-1 mt-8 flex snap-x gap-2 overflow-x-auto px-1 pb-2" aria-label="Kies een dag">
        {days.map((value) => {
          const day = new Date(`${value}T12:00:00Z`);
          const selected = value === date;
          return (
            <Link
              key={value}
              href={`/app/calendar?date=${value}`}
              aria-current={selected ? "date" : undefined}
              className={`min-w-[76px] snap-start rounded-[18px] border px-3 py-3 text-center transition-colors ${selected ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-white hover:bg-[var(--surface)]"}`}
            >
              <span className={`block text-[11px] capitalize ${selected ? "text-white/55" : "text-[var(--muted)]"}`}>
                {new Intl.DateTimeFormat("nl-NL", { weekday: "short", timeZone: "UTC" }).format(day)}
              </span>
              <span className="mt-1 block text-sm font-semibold tabular-nums">
                {new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" }).format(day)}
              </span>
            </Link>
          );
        })}
      </div>

      <section className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Dagplanning</h2>
          <p className="text-xs text-[var(--muted)]">{appointments.length} {appointments.length === 1 ? "afspraak" : "afspraken"}</p>
        </div>

        {!appointments.length ? (
          <EmptyState
            title="Geen afspraken"
            description="Er zijn voor deze dag nog geen afspraken gepland."
            {...(membership.role !== "staff" ? { action: "+ Afspraak", href: "/app/calendar/new" } : {})}
          />
        ) : (
          <div className="rounded-[var(--radius-card-sm)] bg-[var(--surface)] p-3 sm:p-4">
            <div className="grid gap-2">
              {appointments.map((item) => {
                const quiet = ["cancelled", "no_show"].includes(item.status);
                return (
                  <div key={item.id} className={`grid grid-cols-[48px_minmax(0,1fr)] gap-2 sm:grid-cols-[62px_minmax(0,1fr)] sm:gap-3 ${quiet ? "opacity-55" : ""}`}>
                    <div className="pt-3 text-right">
                      <time className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                        {formatInTimeZone(new Date(item.starts_at), salon.timezone, "HH:mm")}
                      </time>
                      <span className="mx-auto mt-2 block h-full min-h-8 w-px bg-[var(--line)]" aria-hidden="true" />
                    </div>
                    <Link
                      href={`/app/appointments/${item.id}`}
                      className="salon-float min-w-0 rounded-[18px] border border-[var(--line)] bg-white px-4 py-3.5 sm:px-5 sm:py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold tracking-[-0.02em]">
                            {item.customer?.name ?? item.customer_name_snapshot ?? "Klant"}
                          </p>
                          <p className="mt-1 truncate text-sm text-[var(--muted)]">
                            {item.service_name_snapshot}
                            {item.staff?.name ? ` · ${item.staff.name}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
                          {formatInTimeZone(new Date(item.service_ends_at), salon.timezone, "HH:mm")}
                        </span>
                      </div>
                      <p className="mt-3 text-[11px] font-medium text-[var(--muted)]">
                        {statusLabels[item.status] ?? item.status.replaceAll("_", " ")}
                      </p>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
